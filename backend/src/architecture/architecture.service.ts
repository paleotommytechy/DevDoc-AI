import { dbService, ProjectEntity } from "../services/db.service";
import { ProjectService } from "../services/project.service";
import { MermaidGenerator } from "./mermaid.generator";
import { logger } from "../utils/logger";

export interface DiagramResult {
  id?: string;
  project_id: string;
  diagram_type: string;
  mermaid_code: string;
  generated_at?: Date;
}

export class ArchitectureService {
  /**
   * Generates and stores all 7 diagrams for a specific project
   */
  static async generateAllDiagrams(projectId: string, userId: string): Promise<DiagramResult[]> {
    logger.info(`🏗️ Generating architecture diagrams for Project: ${projectId}`);
    
    // 1. Verify project exists and belongs to user
    const project = await ProjectService.getProject(projectId, userId);
    
    // 2. Fetch project endpoints
    const endpoints = await dbService.getProjectEndpoints(projectId);

    // 3. Define diagram types and their generation functions
    const generators = [
      {
        type: "folder_tree",
        fn: () => MermaidGenerator.generateFolderTree(project, endpoints),
      },
      {
        type: "route_controller",
        fn: () => MermaidGenerator.generateRouteController(endpoints),
      },
      {
        type: "controller_service",
        fn: () => MermaidGenerator.generateControllerService(endpoints),
      },
      {
        type: "service_database",
        fn: () => MermaidGenerator.generateServiceDatabase(project, endpoints),
      },
      {
        type: "middleware_flow",
        fn: () => MermaidGenerator.generateMiddlewareFlow(endpoints),
      },
      {
        type: "request_lifecycle",
        fn: () => MermaidGenerator.generateRequestLifecycle(project),
      },
      {
        type: "dependency_graph",
        fn: () => MermaidGenerator.generateDependencyGraph(project),
      },
    ];

    const results: DiagramResult[] = [];

    // 4. Generate and save each diagram
    for (const gen of generators) {
      try {
        const code = gen.fn();
        const saved = await dbService.saveProjectDiagram(projectId, gen.type, code);
        results.push({
          id: saved.id,
          project_id: projectId,
          diagram_type: gen.type,
          mermaid_code: saved.mermaid_code || code,
          generated_at: saved.generated_at,
        });
      } catch (err: any) {
        logger.error(`❌ Failed to generate diagram ${gen.type}: ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Retrieves all diagrams for a project.
   * If diagrams do not exist but project is parsed, it triggers lazy-generation.
   */
  static async getProjectDiagrams(projectId: string, userId: string): Promise<DiagramResult[]> {
    // 1. Verify ownership first
    const project = await ProjectService.getProject(projectId, userId);

    // 2. Query diagrams table
    let diagrams = await dbService.getProjectDiagrams(projectId);

    // 3. Lazy generation if none found and project is Analyzed/scanned
    if (diagrams.length === 0 && project.status === "Analyzed") {
      logger.info(`✨ Lazily generating architecture diagrams for project ${projectId}`);
      diagrams = await this.generateAllDiagrams(projectId, userId);
    }

    return diagrams;
  }
}
