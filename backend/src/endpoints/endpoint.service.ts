import { dbService } from "../services/db.service";
import { ProjectService } from "../services/project.service";

export class EndpointService {
  /**
   * Fetch all endpoints for a specific project, verifying user ownership.
   */
  static async getEndpointsForProject(projectId: string, userId: string): Promise<any[]> {
    // Verify ownership first (throws 404/403 if invalid)
    await ProjectService.getProject(projectId, userId);
    return dbService.getProjectEndpoints(projectId);
  }

  /**
   * Fetch details of a single endpoint, verifying user ownership of its project.
   */
  static async getEndpointDetails(endpointId: string, userId: string): Promise<any> {
    const endpoint = await dbService.getEndpointById(endpointId);
    if (!endpoint) {
      const error = new Error("Endpoint not found") as any;
      error.status = 404;
      throw error;
    }

    // Verify ownership of the associated project
    await ProjectService.getProject(endpoint.project_id, userId);
    return endpoint;
  }
}
