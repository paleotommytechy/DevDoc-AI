import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ArchitectureService } from "./architecture.service";
import { logger } from "../utils/logger";

export class ArchitectureController {
  /**
   * GET /api/projects/:id/architecture
   * Retrieves all generated Mermaid diagrams for a project.
   */
  static async getDiagrams(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      logger.info(`🎮 Fetching architecture diagrams. Project: ${projectId}, User: ${userId}`);
      const diagrams = await ArchitectureService.getProjectDiagrams(projectId, userId);

      res.status(200).json({
        success: true,
        data: diagrams,
      });
    } catch (err: any) {
      logger.error(`❌ Failed to get diagrams controller: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Failed to retrieve architecture diagrams.",
      });
    }
  }

  /**
   * POST /api/projects/:id/architecture/regenerate
   * Forcefully regenerates and overwrites all architecture diagrams for a project.
   */
  static async regenerateDiagrams(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      logger.info(`🎮 Regenerating architecture diagrams. Project: ${projectId}, User: ${userId}`);
      const diagrams = await ArchitectureService.generateAllDiagrams(projectId, userId);

      res.status(200).json({
        success: true,
        message: "Architecture diagrams generated and saved successfully.",
        data: diagrams,
      });
    } catch (err: any) {
      logger.error(`❌ Failed to regenerate diagrams controller: ${err.message}`);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Failed to regenerate architecture diagrams.",
      });
    }
  }
}
