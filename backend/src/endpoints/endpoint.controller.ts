import { Response, NextFunction } from "express";
import { EndpointService } from "./endpoint.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class EndpointController {
  /**
   * Retrieves all endpoints for a specific project.
   * GET /api/projects/:projectId/endpoints
   */
  static async getProjectEndpoints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;

      const endpoints = await EndpointService.getEndpointsForProject(projectId, userId);

      res.status(200).json({
        success: true,
        message: "Project endpoints retrieved successfully.",
        data: {
          endpoints,
        },
      });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({
          success: false,
          message: err.message,
        });
      } else {
        next(err);
      }
    }
  }

  /**
   * Retrieves details of an endpoint by ID.
   * GET /api/endpoints/:endpointId
   */
  static async getEndpointDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpointId } = req.params;
      const userId = req.user!.userId;

      const endpoint = await EndpointService.getEndpointDetails(endpointId, userId);

      res.status(200).json({
        success: true,
        message: "Endpoint details retrieved successfully.",
        data: {
          endpoint,
        },
      });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({
          success: false,
          message: err.message,
        });
      } else {
        next(err);
      }
    }
  }
}
