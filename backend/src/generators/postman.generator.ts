import { ProjectEntity } from "../services/db.service";

export class PostmanGenerator {
  /**
   * Converts project metadata and discovered endpoints into a Postman Collection v2.1 Object
   */
  static generateCollection(project: ProjectEntity, endpoints: any[] = []): Record<string, any> {
    const title = project.name || "API Collection";
    const description = project.description || `Auto-generated Postman Collection for ${title} compiled by DevDoc AI.`;

    const sourceEndpoints = endpoints.length > 0 
      ? endpoints 
      : (project.routes_discovered || []).map((r: any) => ({
          method: r.method || "GET",
          route: r.endpoint || r.route || "/",
          sourceFile: r.sourceFile || "controllers",
          sampleRequest: { exampleField: "value" }
        }));

    const items = sourceEndpoints.map((ep: any) => {
      let rawRoute = ep.route || ep.endpoint || "/";
      if (!rawRoute.startsWith("/")) rawRoute = "/" + rawRoute;

      const method = (ep.method || "GET").toUpperCase();
      const pathSegments = rawRoute.split("/").filter(Boolean);

      const request: Record<string, any> = {
        method,
        header: [
          {
            key: "Content-Type",
            value: "application/json"
          },
          {
            key: "Accept",
            value: "application/json"
          }
        ],
        url: {
          raw: "{{baseUrl}}" + rawRoute,
          host: ["{{baseUrl}}"],
          path: pathSegments
        },
        description: `Endpoint implementation in \`${ep.sourceFile || "source"}\`.`
      };

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const bodyContent = ep.sampleRequest ? JSON.stringify(ep.sampleRequest, null, 2) : "{\n  \"example\": \"data\"\n}";
        request.body = {
          mode: "raw",
          raw: bodyContent,
          options: {
            raw: {
              language: "json"
            }
          }
        };
      }

      return {
        name: `${method} ${rawRoute}`,
        request,
        response: []
      };
    });

    return {
      info: {
        name: `${title} - Postman Collection`,
        description,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: items,
      variable: [
        {
          key: "baseUrl",
          value: process.env.APP_URL || "http://localhost:3000",
          type: "string"
        }
      ]
    };
  }
}
