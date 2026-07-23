import { ProjectEntity } from "../services/db.service";

export class OpenApiGenerator {
  /**
   * Converts project metadata and discovered endpoints into an OpenAPI 3.1 Specification Object
   */
  static generateSpec(project: ProjectEntity, endpoints: any[] = []): Record<string, any> {
    const title = project.name || "API Specification";
    const description = project.description || `Auto-generated OpenAPI 3.1.0 specification for ${title} compiled by DevDoc AI.`;
    const version = "1.0.0";

    const paths: Record<string, any> = {};

    const sourceEndpoints = endpoints.length > 0 
      ? endpoints 
      : (project.routes_discovered || []).map((r: any) => ({
          method: r.method || "GET",
          route: r.endpoint || r.route || "/",
          sourceFile: r.sourceFile || "controllers",
          authenticationRequired: true,
          responseStatusCodes: [200, 400, 401, 500],
          requestSchema: { type: "object", properties: {} },
          responseSchema: { type: "object", properties: { status: { type: "string" } } },
          pathParameters: [],
          queryParameters: []
        }));

    sourceEndpoints.forEach((ep: any) => {
      let rawRoute = ep.route || ep.endpoint || "/";
      if (!rawRoute.startsWith("/")) {
        rawRoute = "/" + rawRoute;
      }
      
      // Convert Express path params like /users/:id to OpenAPI format /users/{id}
      const openApiRoute = rawRoute.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

      if (!paths[openApiRoute]) {
        paths[openApiRoute] = {};
      }

      const method = (ep.method || "GET").toLowerCase();

      // Path parameters
      const parameters: any[] = [];
      if (ep.pathParameters && Array.isArray(ep.pathParameters)) {
        ep.pathParameters.forEach((param: string) => {
          parameters.push({
            name: param,
            in: "path",
            required: true,
            schema: { type: "string" },
            description: `Path parameter ${param}`
          });
        });
      }

      // Query parameters
      if (ep.queryParameters && Array.isArray(ep.queryParameters)) {
        ep.queryParameters.forEach((param: string) => {
          parameters.push({
            name: param,
            in: "query",
            required: false,
            schema: { type: "string" },
            description: `Query parameter ${param}`
          });
        });
      }

      const responses: Record<string, any> = {};
      const statusCodes = ep.responseStatusCodes && ep.responseStatusCodes.length > 0 
        ? ep.responseStatusCodes 
        : [200, 400, 401, 500];

      statusCodes.forEach((code: number) => {
        responses[code.toString()] = {
          description: this.getStatusDescription(code),
          content: {
            "application/json": {
              schema: ep.responseSchema || {
                type: "object",
                properties: {
                  success: { type: "boolean", example: code >= 200 && code < 300 },
                  message: { type: "string", example: this.getStatusDescription(code) }
                }
              }
            }
          }
        };
      });

      const operation: Record<string, any> = {
        summary: `${method.toUpperCase()} ${rawRoute}`,
        description: `Handler in \`${ep.sourceFile || "source"}\`. ${ep.controller ? `Controller: \`${ep.controller}\`` : ""}`,
        tags: [this.extractTagFromRoute(rawRoute)],
        parameters: parameters.length > 0 ? parameters : undefined,
        responses
      };

      if (["post", "put", "patch"].includes(method) && ep.requestSchema) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: ep.requestSchema,
              example: ep.sampleRequest || undefined
            }
          }
        };
      }

      if (ep.authenticationRequired || project.authentication) {
        operation.security = [{ BearerAuth: [] }];
      }

      paths[openApiRoute][method] = operation;
    });

    return {
      openapi: "3.1.0",
      info: {
        title,
        description,
        version
      },
      servers: [
        {
          url: process.env.APP_URL || "http://localhost:3000",
          description: "Development Server"
        }
      ],
      paths,
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your Bearer JWT Token"
          }
        }
      }
    };
  }

  private static getStatusDescription(code: number): string {
    const map: Record<number, string> = {
      200: "Successful operation",
      201: "Resource created successfully",
      204: "No Content",
      400: "Bad Request - Invalid parameters or body payload",
      401: "Unauthorized - Missing or invalid Bearer token",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found - Requested resource does not exist",
      422: "Unprocessable Entity - Schema validation failed",
      500: "Internal Server Error"
    };
    return map[code] || "HTTP Response";
  }

  private static extractTagFromRoute(route: string): string {
    const parts = route.split("/").filter(Boolean);
    if (parts.length > 0 && parts[0] !== "api") {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    if (parts.length > 1) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return "Default";
  }
}
