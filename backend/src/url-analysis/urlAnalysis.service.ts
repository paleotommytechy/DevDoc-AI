import axios from "axios";
import { dbService, ProjectEntity } from "../services/db.service";
import { logger } from "../utils/logger";
import { SwaggerDetector } from "./swaggerDetector";
import { OpenAPIDetector } from "./openapiDetector";
import { UrlCrawler } from "./urlCrawler";

export class UrlAnalysisService {
  /**
   * Validates a URL and checks its protocol.
   */
  static validateUrl(inputUrl: string): URL {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(inputUrl);
    } catch (err) {
      throw new Error("Invalid URL format. Please provide a valid, fully qualified URL (e.g., http://localhost:3000).");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`Unsupported protocol '${parsedUrl.protocol}'. Only HTTP and HTTPS protocols are supported.`);
    }

    return parsedUrl;
  }

  /**
   * Detects whether a URL is a Local or Public URL.
   */
  static isLocalUrl(parsedUrl: URL): boolean {
    const hostname = parsedUrl.hostname.toLowerCase();

    // Check common local loopback hostnames / IPs
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    ) {
      return true;
    }

    // Check private IP ranges (IPv4)
    // 10.0.0.0 to 10.255.255.255
    // 172.16.0.0 to 172.31.255.255
    // 192.168.0.0 to 192.168.255.255
    // 169.254.0.0 to 169.254.255.255 (link-local)
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      const [p1, p2] = parts;
      if (p1 === 10) return true;
      if (p1 === 192 && p2 === 168) return true;
      if (p1 === 169 && p2 === 254) return true;
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
    }

    return false;
  }

  /**
   * Verifies if a server is reachable with a short timeout.
   */
  static async checkServerAvailability(url: string): Promise<any> {
    try {
      // Try GET with 4000ms timeout
      const response = await axios.get(url, {
        timeout: 4000,
        headers: { "User-Agent": "DevDocAI/1.0" },
        validateStatus: () => true // accept any response code
      });
      return response;
    } catch (err: any) {
      logger.error(`Server availability check failed for ${url}: ${err.message}`);
      throw new Error(`The server at ${url} is unreachable or timed out. Please verify that the application is running and accessible.`);
    }
  }

  /**
   * Orchestrates the URL analysis pipeline for a project.
   */
  static async analyzeUrl(projectId: string, userId: string, inputUrl: string): Promise<ProjectEntity> {
    logger.info(`🌐 Initiating URL Analysis pipeline for Project: ${projectId}, URL: ${inputUrl}`);

    // Update status to Analyzing
    await dbService.updateProjectScanResults(projectId, userId, {
      analysis_status: "Analyzing",
      status: "Analyzing",
    });

    try {
      // 1. Validate URL
      const parsedUrl = this.validateUrl(inputUrl);
      const isLocal = this.isLocalUrl(parsedUrl);
      const sourceType = isLocal ? "LOCAL_URL" : "PUBLIC_URL";

      // 2. Check Server Availability
      const initialResponse = await this.checkServerAvailability(inputUrl);

      // Save initial project source info
      await this.saveProjectSource(projectId, {
        source_type: sourceType,
        source_url: inputUrl,
        scan_status: "IN_PROGRESS",
      });

      // Framework extraction helper from response headers
      let detectedFramework = "Unknown";
      const xPoweredBy = initialResponse.headers["x-powered-by"] || "";
      if (xPoweredBy.toLowerCase().includes("express")) {
        detectedFramework = "Express";
      } else if (xPoweredBy.toLowerCase().includes("fastify")) {
        detectedFramework = "Fastify";
      } else if (initialResponse.headers["server"] || "") {
        const serverHeader = initialResponse.headers["server"].toLowerCase();
        if (serverHeader.includes("next.js") || serverHeader.includes("nextjs")) {
          detectedFramework = "Next.js";
        }
      }

      // 3. Attempt Documentation Auto-Discovery
      const checkPaths: string[] = [];
      const cleanInputUrl = inputUrl.replace(/\/$/, "");
      const originUrl = parsedUrl.origin;

      // We'll search paths relative to both input URL and origin
      const searchBases = [cleanInputUrl];
      if (cleanInputUrl !== originUrl) {
        searchBases.push(originUrl);
      }

      const suffixes = ["/swagger.json", "/openapi.json", "/api-docs", "/docs"];
      for (const base of searchBases) {
        for (const suffix of suffixes) {
          checkPaths.push(base + suffix);
        }
      }

      let parsedEndpoints: any[] = [];
      let docsFoundUrl = "";
      let discoveryType = "";

      for (const checkPath of checkPaths) {
        try {
          logger.info(`🔍 Probing doc-discovery path: ${checkPath}`);
          const res = await axios.get(checkPath, {
            timeout: 2000,
            headers: { "Accept": "application/json" }
          });

          if (res.status === 200 && res.data && typeof res.data === "object") {
            const data = res.data;
            if (OpenAPIDetector.isOpenAPI(data)) {
              logger.info(`✅ Successfully discovered OpenAPI spec at: ${checkPath}`);
              parsedEndpoints = OpenAPIDetector.parse(data);
              docsFoundUrl = checkPath;
              discoveryType = "OpenAPI Spec";
              break;
            } else if (SwaggerDetector.isSwagger(data)) {
              logger.info(`✅ Successfully discovered Swagger spec at: ${checkPath}`);
              parsedEndpoints = SwaggerDetector.parse(data);
              docsFoundUrl = checkPath;
              discoveryType = "Swagger Spec";
              break;
            }
          }
        } catch (e: any) {
          // Keep probing
          logger.debug(`Failed doc-discovery check for ${checkPath}: ${e.message}`);
        }
      }

      // 4. Fallback to Crawler if no auto-discovery docs found
      if (parsedEndpoints.length === 0) {
        logger.info(`⚠️ No JSON Swagger/OpenAPI specifications discovered. Initializing Crawler discovery...`);
        parsedEndpoints = await UrlCrawler.crawl(inputUrl);
        discoveryType = "Live Crawl Discovery";
      }

      // 5. Store Discovered Endpoints
      await dbService.saveProjectEndpoints(projectId, parsedEndpoints);

      // 6. Summarize & Save Project Discovery Details
      const controllerCount = new Set(parsedEndpoints.map(e => e.controller).filter(Boolean)).size;
      const middlewareCount = new Set(parsedEndpoints.flatMap(e => e.middleware || []).filter(Boolean)).size;
      const hasAuth = parsedEndpoints.some(e => e.authenticationRequired);

      const routesSummary = parsedEndpoints.map(ep => ({
        method: ep.method,
        endpoint: ep.route,
        sourceFile: ep.sourceFile,
      }));

      const scanResultData = {
        framework: discoveryType.includes("Spec") ? discoveryType : detectedFramework,
        language: "TypeScript/JavaScript", // default assumption for web endpoints
        route_count: parsedEndpoints.length,
        controller_count: controllerCount,
        middleware_count: middlewareCount,
        model_count: 0,
        database: "Unknown",
        authentication: hasAuth ? "Detected" : "None",
        analysis_status: "Completed",
        status: "Analyzed",
        analysis_completed_at: new Date(),
        routes_discovered: routesSummary,
      };

      const updatedProject = await dbService.updateProjectScanResults(projectId, userId, scanResultData);

      // Update project source status
      await this.saveProjectSource(projectId, {
        source_type: sourceType,
        source_url: inputUrl,
        scan_status: "COMPLETED",
        last_scan_at: new Date(),
      });

      logger.info(`✅ URL Analysis completed successfully. ${parsedEndpoints.length} endpoints discovered.`);
      return updatedProject!;
    } catch (err: any) {
      logger.error(`❌ URL Analysis failed for Project ${projectId}: ${err.message}`, err);

      await dbService.updateProjectScanResults(projectId, userId, {
        analysis_status: "Failed",
        status: "Error",
      });

      // Update source status to FAILED
      try {
        const isLocal = inputUrl.includes("localhost") || inputUrl.includes("127.0.0.1");
        await this.saveProjectSource(projectId, {
          source_type: isLocal ? "LOCAL_URL" : "PUBLIC_URL",
          source_url: inputUrl,
          scan_status: "FAILED",
          last_scan_at: new Date(),
        });
      } catch (e) {}

      throw err;
    }
  }

  /**
   * Helper to write project source records to persistent store / fallbacks.
   */
  private static async saveProjectSource(
    projectId: string,
    source: {
      source_type: string;
      source_url: string;
      scan_status: string;
      last_scan_at?: Date;
    }
  ) {
    // We will save to supabase table if not in fallback, or handle gracefully
    // Let's create helper methods in dbService or call queries on direct SQL client
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl && !dbService["isFallback"]) {
        const pg = await import("pg");
        const useSsl = dbUrl.includes("supabase") || dbUrl.includes("elephantsql") || dbUrl.includes("render");
        const client = new pg.default.Client({
          connectionString: dbUrl,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        });
        await client.connect();
        
        // Check if record exists
        const check = await client.query(`SELECT id FROM project_sources WHERE project_id = $1`, [projectId]);
        if (check.rows.length > 0) {
          await client.query(
            `UPDATE project_sources 
             SET source_type = $1, source_url = $2, scan_status = $3, last_scan_at = $4 
             WHERE project_id = $5`,
            [source.source_type, source.source_url, source.scan_status, source.last_scan_at || new Date(), projectId]
          );
        } else {
          await client.query(
            `INSERT INTO project_sources (project_id, source_type, source_url, scan_status, last_scan_at) 
             VALUES ($1, $2, $3, $4, $5)`,
            [projectId, source.source_type, source.source_url, source.scan_status, source.last_scan_at || new Date()]
          );
        }
        await client.end();
      } else {
        // Safe fallback: Add mock properties inside dbService in-memory project store
        // Let's store on the project entity itself for quick access!
        const project = dbService["inMemoryProjects"].find(p => p.id === projectId);
        if (project) {
          (project as any).source_type = source.source_type;
          (project as any).source_url = source.source_url;
          (project as any).scan_status = source.scan_status;
          (project as any).last_scan_at = source.last_scan_at || new Date();
        }
      }
    } catch (err: any) {
      logger.error(`Error saving project source detail: ${err.message}`);
    }
  }
}
