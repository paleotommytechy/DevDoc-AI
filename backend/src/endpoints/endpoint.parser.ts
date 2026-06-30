import { logger } from "../utils/logger";
import { EndpointGenerator } from "./endpoint.generator";

export interface DiscoveredEndpoint {
  method: string;
  route: string;
  sourceFile: string;
  controller: string | null;
  middleware: string[];
  authenticationRequired: boolean;
  validationLibrary: string | null;
  requestSchema: any;
  responseSchema: any;
  sampleRequest: any;
  sampleResponse: any;
  queryParameters: string[];
  pathParameters: string[];
  responseStatusCodes: number[];
}

export class EndpointParser {
  /**
   * Parse a list of codebase files to discover detailed endpoints.
   */
  static parseCodebase(files: { filePath: string; content: string }[]): DiscoveredEndpoint[] {
    const endpoints: DiscoveredEndpoint[] = [];

    for (const file of files) {
      const { filePath, content } = file;

      // Skip non-code files
      if (
        !filePath.endsWith(".ts") &&
        !filePath.endsWith(".js") &&
        !filePath.endsWith(".tsx") &&
        !filePath.endsWith(".jsx")
      ) {
        continue;
      }

      // Regex to find Express route declarations, e.g.:
      // router.get('/users/:id', authMiddleware, userController.getUser)
      // app.post('/register', validate(registerSchema), auth.register)
      const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(.*?)\s*\)/gis;

      let match;
      while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const route = match[2];
        const handlersText = match[3];

        // Parse path parameters, e.g. /users/:id -> id
        const pathParams: string[] = [];
        const pathParamRegex = /:(\w+)/g;
        let pathMatch;
        while ((pathMatch = pathParamRegex.exec(route)) !== null) {
          pathParams.push(pathMatch[1]);
        }

        // Parse controllers and middlewares from the handlersText
        const handlers = this.splitHandlers(handlersText);

        let controller: string | null = null;
        let middleware: string[] = [];
        let authRequired = false;
        let validationLib: string | null = null;

        if (handlers.length > 0) {
          // Usually the last handler is the controller
          controller = handlers[handlers.length - 1];
          // Middlewares are everything in between
          middleware = handlers.slice(0, handlers.length - 1);
        }

        // Determine if authentication is required by looking at middlewares
        const authKeywords = ["auth", "login", "jwt", "passport", "session", "requireuser", "protect", "authenticate", "secured"];
        const middlewareLower = middleware.map(m => m.toLowerCase());
        const hasAuthMiddleware = middlewareLower.some(m => authKeywords.some(keyword => m.includes(keyword)));
        
        // Also check if route string contains /api/secure/ or similar or file has global auth
        authRequired = hasAuthMiddleware || content.toLowerCase().includes("router.use(auth") || content.toLowerCase().includes("router.use(jwt");

        // Detect validation library
        validationLib = this.detectValidationLibrary(content, handlersText);

        // Attempt to parse validation schemas / parameters for body and query
        const bodyFields = this.extractBodyFields(content, handlersText, route, filePath, files);
        const queryParams = this.extractQueryParameters(content, handlersText, route, filePath, files);

        // Detect response status codes
        const statusCodes = this.detectResponseStatusCodes(content, controller, method);

        // Generate schemas and samples using generator
        const sampleRequest = EndpointGenerator.generateSampleRequest(bodyFields, route, method);
        const sampleResponse = EndpointGenerator.generateSampleResponse(route, method, statusCodes[0] || 200);

        const requestSchema = {
          type: "object",
          properties: Object.keys(bodyFields).reduce((acc: any, key) => {
            acc[key] = { type: bodyFields[key] };
            return acc;
          }, {}),
        };

        const responseSchema = {
          type: "object",
          properties: Object.keys(sampleResponse).reduce((acc: any, key) => {
            const val = sampleResponse[key];
            acc[key] = { type: typeof val };
            return acc;
          }, {}),
        };

        // Avoid duplicates in the exact same file
        const isDuplicate = endpoints.some(
          (e) => e.method === method && e.route === route && e.sourceFile === filePath
        );

        if (!isDuplicate) {
          endpoints.push({
            method,
            route,
            sourceFile: filePath,
            controller,
            middleware,
            authenticationRequired: authRequired,
            validationLibrary: validationLib,
            requestSchema,
            responseSchema,
            sampleRequest,
            sampleResponse,
            queryParameters: queryParams,
            pathParameters: pathParams,
            responseStatusCodes: statusCodes,
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Splits express handler string by commas, taking care of parentheses
   */
  private static splitHandlers(handlersText: string): string[] {
    const handlers: string[] = [];
    let current = "";
    let parenCount = 0;

    for (let i = 0; i < handlersText.length; i++) {
      const char = handlersText[i];
      if (char === "(") {
        parenCount++;
        current += char;
      } else if (char === ")") {
        parenCount--;
        current += char;
      } else if (char === "," && parenCount === 0) {
        const trimmed = current.trim();
        if (trimmed) handlers.push(trimmed);
        current = "";
      } else {
        current += char;
      }
    }

    const trimmed = current.trim();
    if (trimmed) handlers.push(trimmed);

    return handlers.map(h => h.replace(/\s+/g, " "));
  }

  /**
   * Detect validation library used based on content and handler signatures
   */
  private static detectValidationLibrary(fileContent: string, handlersText: string): string | null {
    const textToCheck = (fileContent + " " + handlersText).toLowerCase();
    if (textToCheck.includes("zod") || textToCheck.includes("z.object") || textToCheck.includes("safeparse")) {
      return "Zod";
    }
    if (textToCheck.includes("joi") || textToCheck.includes("joi.object")) {
      return "Joi";
    }
    if (textToCheck.includes("express-validator") || textToCheck.includes("body(") || textToCheck.includes("query(") || textToCheck.includes("validationresult")) {
      return "Express Validator";
    }
    return null;
  }

  /**
   * Extracts fields for the request body.
   */
  private static extractBodyFields(
    fileContent: string,
    handlersText: string,
    route: string,
    filePath: string,
    allFiles: { filePath: string; content: string }[]
  ): Record<string, string> {
    const fields: Record<string, string> = {};

    // Let's attempt to look for validation schema references in the handler
    const schemaRefRegex = /validate(?:body)?\s*\(\s*(\w+)/i;
    const match = schemaRefRegex.exec(handlersText);
    let schemaName = match ? match[1] : null;

    if (!schemaName) {
      // Look for express-validator body('xxx') patterns in this file
      const expressValidatorRegex = /body\s*\(\s*['"`](\w+)['"`]/g;
      let evMatch;
      while ((evMatch = expressValidatorRegex.exec(fileContent)) !== null) {
        fields[evMatch[1]] = "string";
      }
    }

    // Find schema in files (same file or any file in codebase)
    let schemaDefinitionText = "";
    if (schemaName) {
      const searchRegex = new RegExp(`const\\s+${schemaName}\\s*=`, "i");
      if (searchRegex.test(fileContent)) {
        schemaDefinitionText = fileContent;
      } else {
        for (const file of allFiles) {
          if (searchRegex.test(file.content)) {
            schemaDefinitionText = file.content;
            break;
          }
        }
      }
    }

    // Parse schema definition text (Zod or Joi)
    if (schemaDefinitionText) {
      const zodFieldRegex = /(\w+)\s*:\s*z\.(string|number|boolean|array|object)/gi;
      let zodMatch;
      while ((zodMatch = zodFieldRegex.exec(schemaDefinitionText)) !== null) {
        fields[zodMatch[1]] = zodMatch[2].toLowerCase();
      }

      const joiFieldRegex = /(\w+)\s*:\s*Joi\.(string|number|boolean|array|object)/gi;
      let joiMatch;
      while ((joiMatch = joiFieldRegex.exec(schemaDefinitionText)) !== null) {
        fields[joiMatch[1]] = joiMatch[2].toLowerCase();
      }
    }

    // Fallback: Search the file for destructuring of req.body
    const destructureRegex = /(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*req\.body/g;
    let destMatch;
    while ((destMatch = destructureRegex.exec(fileContent)) !== null) {
      const vars = destMatch[1].split(",").map(v => v.trim().split(" ")[0].split(":")[0]);
      for (const v of vars) {
        if (v && !v.includes("...") && !fields[v]) {
          fields[v] = "string";
        }
      }
    }

    // Fallback: search for direct req.body.xxx access
    const directAccessRegex = /req\.body\.(\w+)/g;
    let directMatch;
    while ((directMatch = directAccessRegex.exec(fileContent)) !== null) {
      fields[directMatch[1]] = "string";
    }

    // Default bodies for common routes if none found
    if (Object.keys(fields).length === 0) {
      const routeLower = route.toLowerCase();
      if (routeLower.includes("user") || routeLower.includes("auth") || routeLower.includes("register") || routeLower.includes("login") || routeLower.includes("signup")) {
        if (routeLower.includes("login") || routeLower.includes("signin")) {
          return { email: "string", password: "string" };
        }
        return { name: "string", email: "string", password: "string" };
      }
      if (routeLower.includes("project")) {
        return { name: "string", description: "string" };
      }
    }

    return fields;
  }

  /**
   * Extracts query parameters.
   */
  private static extractQueryParameters(
    fileContent: string,
    handlersText: string,
    route: string,
    filePath: string,
    allFiles: { filePath: string; content: string }[]
  ): string[] {
    const params = new Set<string>();

    const expressValidatorRegex = /query\s*\(\s*['"`](\w+)['"`]/g;
    let evMatch;
    while ((evMatch = expressValidatorRegex.exec(fileContent)) !== null) {
      params.add(evMatch[1]);
    }

    const destructureRegex = /(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*req\.query/g;
    let destMatch;
    while ((destMatch = destructureRegex.exec(fileContent)) !== null) {
      const vars = destMatch[1].split(",").map(v => v.trim().split(" ")[0].split(":")[0]);
      for (const v of vars) {
        if (v && !v.includes("...") && v !== "req") {
          params.add(v);
        }
      }
    }

    const directAccessRegex = /req\.query\.(\w+)/g;
    let directMatch;
    while ((directMatch = directAccessRegex.exec(fileContent)) !== null) {
      params.add(directMatch[1]);
    }

    if (params.size === 0 && (route.endsWith("s") || route.includes("search") || route.includes("list"))) {
      return ["page", "limit", "search"];
    }

    return Array.from(params);
  }

  /**
   * Detects status codes used in the file content.
   */
  private static detectResponseStatusCodes(fileContent: string, controllerName: string | null, method: string): number[] {
    const codes = new Set<number>();

    const statusRegex = /status\s*\(\s*(\d{3})\s*\)/g;
    let match;
    while ((match = statusRegex.exec(fileContent)) !== null) {
      codes.add(parseInt(match[1], 10));
    }

    const sendStatusRegex = /sendStatus\s*\(\s*(\d{3})\s*\)/g;
    let sendMatch;
    while ((sendMatch = sendStatusRegex.exec(fileContent)) !== null) {
      codes.add(parseInt(sendMatch[1], 10));
    }

    if (codes.size === 0) {
      if (method === "POST") {
        return [201, 400, 401, 500];
      }
      if (method === "DELETE") {
        return [200, 401, 404, 500];
      }
      return [200, 401, 404, 500];
    }

    return Array.from(codes).sort();
  }
}
