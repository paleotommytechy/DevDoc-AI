import { Response, NextFunction } from "express";
import { z } from "zod";
import { ProjectService } from "../services/project.service";
import { AuthRequest } from "../middlewares/auth.middleware";

// Zod validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").trim(),
  description: z.string().optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name cannot be empty").trim().optional(),
  description: z.string().optional().nullable(),
  status: z.string().trim().optional(),
});

export class ProjectController {
  /**
   * Create a new project
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = createProjectSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed",
        });
        return;
      }

      const { name, description } = validation.data;
      const userId = req.user!.userId;

      const project = await ProjectService.createProject(userId, name, description || null);

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: {
          project,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all projects for logged-in user
   */
  static async getMyProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const projects = await ProjectService.getMyProjects(userId);

      res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        data: {
          projects,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get details of a single project
   */
  static async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const project = await ProjectService.getProject(id, userId);

      res.status(200).json({
        success: true,
        message: "Project retrieved successfully",
        data: {
          project,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update project details
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const validation = updateProjectSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed",
        });
        return;
      }

      const updatedProject = await ProjectService.updateProject(id, userId, validation.data);

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          project: updatedProject,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create interactive demo project
   */
  static async createDemo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || "demo-user";
      const { DemoService } = await import("../services/demo.service");
      const project = await DemoService.createDemoProject(userId);

      res.status(201).json({
        success: true,
        message: "Demo project created successfully",
        data: {
          project,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a project
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await ProjectService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}
