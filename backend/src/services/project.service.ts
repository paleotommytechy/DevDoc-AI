import { dbService, ProjectEntity } from "./db.service";

export class ProjectService {
  /**
   * Creates a new project for a user
   */
  static async createProject(userId: string, name: string, description: string | null): Promise<ProjectEntity> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      const error = new Error("Project name cannot be empty") as any;
      error.status = 400;
      throw error;
    }
    return dbService.createProject(userId, trimmedName, description ? description.trim() : null);
  }

  /**
   * Retrieves all projects for a given user
   */
  static async getMyProjects(userId: string): Promise<ProjectEntity[]> {
    return dbService.getProjectsByUserId(userId);
  }

  /**
   * Retrieves a single project, verifying ownership
   */
  static async getProject(id: string, userId: string): Promise<ProjectEntity> {
    const project = await dbService.getProjectByIdAndUserId(id, userId);
    if (!project) {
      const error = new Error("Project not found or access denied") as any;
      error.status = 404;
      throw error;
    }
    return project;
  }

  /**
   * Updates a single project, verifying ownership
   */
  static async updateProject(
    id: string,
    userId: string,
    updates: { name?: string; description?: string | null; status?: string }
  ): Promise<ProjectEntity> {
    // Check if exists first to return proper 404
    await this.getProject(id, userId);

    const updated = await dbService.updateProject(id, userId, updates);
    if (!updated) {
      const error = new Error("Failed to update project") as any;
      error.status = 500;
      throw error;
    }
    return updated;
  }

  /**
   * Deletes a single project, verifying ownership
   */
  static async deleteProject(id: string, userId: string): Promise<void> {
    // Check if exists first to return proper 404
    await this.getProject(id, userId);

    const deleted = await dbService.deleteProject(id, userId);
    if (!deleted) {
      const error = new Error("Failed to delete project") as any;
      error.status = 500;
      throw error;
    }
  }
}
