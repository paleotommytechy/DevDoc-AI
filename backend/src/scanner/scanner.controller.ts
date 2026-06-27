import { Response, NextFunction } from "express";
import { ScannerService } from "./scanner.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ProjectService } from "../services/project.service";
import { logger } from "../utils/logger";

export class ScannerController {
  /**
   * Endpoint to upload a zip codebase and analyze it
   */
  static async uploadAndAnalyze(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      // 1. Verify project exists and belongs to user
      try {
        await ProjectService.getProject(projectId, userId);
      } catch (err: any) {
        res.status(404).json({
          success: false,
          message: "Project not found or access denied.",
        });
        return;
      }

      // 2. Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No project ZIP archive file was uploaded.",
        });
        return;
      }

      // 3. Scan codebase
      logger.info(`📦 Upload received for Project ${projectId}, starting parsing...`);
      const updatedProject = await ScannerService.scanProject(projectId, userId, req.file.buffer);

      res.status(200).json({
        success: true,
        message: "Codebase uploaded and analyzed successfully.",
        data: {
          project: updatedProject,
        },
      });
    } catch (err: any) {
      logger.error(`❌ Scanner controller failed: ${err.message}`);
      res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred during codebase scanning.",
      });
    }
  }
}
