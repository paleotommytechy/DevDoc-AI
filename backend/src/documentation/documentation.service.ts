import { dbService, ProjectEntity } from "../services/db.service";
import { ProjectService } from "../services/project.service";
import { logger } from "../utils/logger";

export interface DocumentationData {
  readme: string;
  api: string;
}

export class DocumentationService {
  /**
   * Generates or retrieves existing README and API documentation for a project.
   */
  static async getOrGenerateDocumentation(projectId: string, userId: string): Promise<DocumentationData> {
    const project = await ProjectService.getProject(projectId, userId);

    // Reuse existing documentation if it already exists
    if (project.readme_markdown && project.api_markdown) {
      logger.info(`💾 Reusing existing documentation for Project ID: ${projectId}`);
      return {
        readme: project.readme_markdown,
        api: project.api_markdown,
      };
    }

    logger.info(`📝 Generating new template-based documentation for Project ID: ${projectId}`);
    
    // Generate the markdown documentation
    const readme = this.generateReadme(project);
    const api = this.generateApi(project);

    // Persist to the database
    await dbService.updateProjectScanResults(projectId, userId, {
      readme_markdown: readme,
      api_markdown: api,
    });

    return { readme, api };
  }

  /**
   * Generates README.md using project metadata and template
   */
  private static generateReadme(project: ProjectEntity): string {
    const name = project.name || "Untitled Project";
    const description = project.description || "No description provided.";
    const framework = project.framework || "Unknown Framework";
    const language = project.language || "Unknown Language";
    const database = project.database || "Unknown Database";
    const authentication = project.authentication || "Unknown Authentication";
    const routeCount = project.route_count !== undefined && project.route_count !== null ? project.route_count : 0;
    const controllerCount = project.controller_count !== undefined && project.controller_count !== null ? project.controller_count : 0;
    const modelCount = project.model_count !== undefined && project.model_count !== null ? project.model_count : 0;
    const middlewareCount = project.middleware_count !== undefined && project.middleware_count !== null ? project.middleware_count : 0;

    return `# ${name}

## Description
${description}

## Technology Stack
- **Framework:** ${framework}
- **Language:** ${language}
- **Database:** ${database}
- **Authentication:** ${authentication}

## Codebase Architecture
Based on static analysis, the codebase is structured around the following core metrics:
- **Total Discovered Routes:** ${routeCount}
- **Controllers:** ${controllerCount}
- **Models/Schemas:** ${modelCount}
- **Middlewares:** ${middlewareCount}

## Project Overview
This project is powered by **${framework}** and written in **${language}**. It leverages **${database}** for persistence and **${authentication}** for securing user access and operations.

### Discovered Modules Summary
- **Routes / Endpoints:** The application registers a total of \`${routeCount}\` direct route listeners to handle external API interactions.
- **Business Logic Layer:** Centered around \`${controllerCount}\` controllers that process incoming requests, execute business constraints, and form standard API responses.
- **Data Persistence Layer:** Modeled around \`${modelCount}\` data tables/schemas to structure and validate records.
- **Middleware Filters:** Runs \`${middlewareCount}\` intermediate interceptor filters to secure routes, sanitize payloads, or manage system policies.

---
*Documentation automatically compiled by DevDoc AI on ${new Date().toLocaleDateString()}.*
`;
  }

  /**
   * Generates API.md using project metadata and template
   */
  private static generateApi(project: ProjectEntity): string {
    const name = project.name || "Untitled Project";
    const framework = project.framework || "Unknown Framework";
    const routeCount = project.route_count !== undefined && project.route_count !== null ? project.route_count : 0;
    const routes = project.routes_discovered || [];

    // Create Endpoint Markdown Table
    let endpointTable = "| HTTP Method | Route Endpoint | Source Implementation File |\n| :--- | :--- | :--- |\n";
    if (routes.length > 0) {
      routes.forEach((route: any) => {
        const method = (route.method || "GET").toUpperCase();
        const endpoint = route.endpoint || "/";
        const sourceFile = route.sourceFile || "Unknown";
        endpointTable += `| \`${method}\` | \`${endpoint}\` | \`${sourceFile}\` |\n`;
      });
    } else {
      endpointTable += "| *N/A* | *No API endpoints discovered in this codebase.* | *N/A* |\n";
    }

    return `# ${name} - API Reference Manual

## Project Overview
This document contains the automatically compiled API specifications for **${name}**, generated through static analysis.

## API Statistics
- **Total Discovered Endpoints:** ${routeCount}
- **Underlying Engine:** ${framework}

## API Endpoint Table
The table below lists all discovered router endpoints, their corresponding HTTP verb/method, and their declared entry files in the project workspace:

${endpointTable}

## Integration & Best Practices
1. **Response Formats:** Ensure that all JSON endpoints output standard HTTP response objects containing clear success indicators and standard status codes.
2. **Authentication Guard:** If the project uses authentication (\`${project.authentication || "Unknown"}\`), protect sensitive routes with appropriate bearer token or cookie validation filters.
3. **Error Management:** Use global exception handler middleware to intercept unhandled exceptions and return safe user-facing error details.

---
*Documentation automatically compiled by DevDoc AI on ${new Date().toLocaleDateString()}.*
`;
  }
}
