import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UrlAnalysisService } from "./urlAnalysis.service";
import { logger } from "../utils/logger";

const urlAnalysisSchema = z.object({
  url: z.string().min(1, "URL is required").trim(),
});

export class UrlAnalysisController {
  /**
   * Analyze a running backend application URL.
   */
  static async analyze(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const userId = req.user!.userId;

      const validation = urlAnalysisSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0]?.message || "URL validation failed.",
        });
        return;
      }

      const { url } = validation.data;

      logger.info(`Controller: Received URL analysis request for project: ${projectId}, URL: ${url}`);

      // Perform URL analysis pipeline
      const updatedProject = await UrlAnalysisService.analyzeUrl(projectId, userId, url);

      res.status(200).json({
        success: true,
        message: "URL analysis completed successfully.",
        data: {
          project: updatedProject,
        },
      });
    } catch (err: any) {
      logger.error(`Controller: URL analysis failed: ${err.message}`);
      res.status(400).json({
        success: false,
        message: err.message || "An unexpected error occurred during URL analysis.",
      });
    }
  }
}
