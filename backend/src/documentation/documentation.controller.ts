import { Response, NextFunction } from "express";
import { DocumentationService } from "./documentation.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ProjectService } from "../services/project.service";
import { logger } from "../utils/logger";

export class DocumentationController {
  /**
   * Get or generate README and API documentation for a project
   */
  static async getDocumentation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      // Verify ownership & project existence
      await ProjectService.getProject(projectId, userId);

      const docs = await DocumentationService.getOrGenerateDocumentation(projectId, userId);

      res.status(200).json({
        success: true,
        message: "Documentation generated successfully.",
        data: docs,
      });
    } catch (err: any) {
      logger.error(`❌ Failed to get or generate documentation: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An error occurred while handling documentation.",
      });
    }
  }

  /**
   * Download README.md file
   */
  static async downloadReadme(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      // Verify ownership & project existence
      await ProjectService.getProject(projectId, userId);

      const docs = await DocumentationService.getOrGenerateDocumentation(projectId, userId);

      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", 'attachment; filename="README.md"');
      res.status(200).send(docs.readme);
    } catch (err: any) {
      logger.error(`❌ Failed to download README.md: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An error occurred while downloading README.md.",
      });
    }
  }

  /**
   * Download API.md file
   */
  static async downloadApi(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      // Verify ownership & project existence
      await ProjectService.getProject(projectId, userId);

      const docs = await DocumentationService.getOrGenerateDocumentation(projectId, userId);

      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", 'attachment; filename="API.md"');
      res.status(200).send(docs.api);
    } catch (err: any) {
      logger.error(`❌ Failed to download API.md: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An error occurred while downloading API.md.",
      });
    }
  }

  /**
   * Download OpenAPI 3.1 JSON Specification
   */
  static async downloadOpenApi(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      const project = await ProjectService.getProject(projectId, userId);
      const { dbService } = await import("../services/db.service");
      const endpoints = await dbService.getProjectEndpoints(projectId);
      const { OpenApiGenerator } = await import("../generators/openapi.generator");
      const spec = OpenApiGenerator.generateSpec(project, endpoints);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${project.name || "openapi"}-spec.json"`);
      res.status(200).json(spec);
    } catch (err: any) {
      logger.error(`❌ Failed to export OpenAPI spec: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An error occurred while exporting OpenAPI spec.",
      });
    }
  }

  /**
   * Download Postman Collection v2.1
   */
  static async downloadPostman(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      const project = await ProjectService.getProject(projectId, userId);
      const { dbService } = await import("../services/db.service");
      const endpoints = await dbService.getProjectEndpoints(projectId);
      const { PostmanGenerator } = await import("../generators/postman.generator");
      const collection = PostmanGenerator.generateCollection(project, endpoints);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${project.name || "postman"}-collection.json"`);
      res.status(200).json(collection);
    } catch (err: any) {
      logger.error(`❌ Failed to export Postman collection: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An error occurred while exporting Postman collection.",
      });
    }
  }
}
