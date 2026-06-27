import AdmZip from "adm-zip";
import { dbService, ProjectEntity } from "../services/db.service";
import { logger } from "../utils/logger";

export interface ScanResult {
  framework: string;
  language: string;
  route_count: number;
  controller_count: number;
  middleware_count: number;
  model_count: number;
  database: string;
  authentication: string;
  routes_discovered: { method: string; endpoint: string; sourceFile: string }[];
}

export class ScannerService {
  /**
   * Scans an uploaded project zip file in-memory and saves results to DB
   */
  static async scanProject(projectId: string, userId: string, fileBuffer: Buffer): Promise<ProjectEntity> {
    logger.info(`🔍 Starting intelligent scan for Project ID: ${projectId}, User ID: ${userId}`);
    
    // Set status to Analyzing first
    await dbService.updateProjectScanResults(projectId, userId, {
      analysis_status: "Analyzing",
      status: "Analyzing",
    });

    try {
      const zip = new AdmZip(fileBuffer);
      const entries = zip.getEntries();
      
      let tsFilesCount = 0;
      let jsFilesCount = 0;
      let controller_count = 0;
      let middleware_count = 0;
      let model_count = 0;
      
      let packageJsonContent: any = null;
      let database = "Unknown";
      let authentication = "Unknown";
      let framework = "Unknown";
      
      const routesDiscovered: { method: string; endpoint: string; sourceFile: string }[] = [];

      // We'll gather file contents to check for database / authentication keywords
      const fileContentsToCheck: { filePath: string; content: string }[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        
        const filePath = entry.entryName;
        
        // Skip dependencies, git records, and build outputs
        if (
          filePath.includes("node_modules/") ||
          filePath.includes(".git/") ||
          filePath.includes("dist/") ||
          filePath.includes("build/") ||
          filePath.includes(".next/")
        ) {
          continue;
        }

        const fileName = filePath.split("/").pop() || "";
        
        // Language detection by file counts
        if (fileName.endsWith(".ts")) {
          tsFilesCount++;
        } else if (fileName.endsWith(".js")) {
          jsFilesCount++;
        }

        // Package.json detection
        if (fileName === "package.json") {
          try {
            const raw = entry.getData().toString("utf8");
            packageJsonContent = JSON.parse(raw);
          } catch (err) {
            logger.error(`Error parsing package.json in zip: ${err}`);
          }
        }

        // Controller discovery (by folder name or file suffix)
        if (
          filePath.includes("/controllers/") ||
          filePath.includes("/controller/") ||
          fileName.toLowerCase().endsWith("controller.ts") ||
          fileName.toLowerCase().endsWith("controller.js")
        ) {
          controller_count++;
        }

        // Middleware discovery (by folder name or file suffix)
        if (
          filePath.includes("/middlewares/") ||
          filePath.includes("/middleware/") ||
          fileName.toLowerCase().endsWith("middleware.ts") ||
          fileName.toLowerCase().endsWith("middleware.js")
        ) {
          middleware_count++;
        }

        // Models discovery (by folder name or file suffix)
        if (
          filePath.includes("/models/") ||
          filePath.includes("/entities/") ||
          filePath.includes("/schemas/") ||
          filePath.includes("/schema/") ||
          fileName.toLowerCase().endsWith(".model.ts") ||
          fileName.toLowerCase().endsWith(".model.js") ||
          fileName.toLowerCase().endsWith(".entity.ts") ||
          fileName.toLowerCase().endsWith(".entity.js") ||
          fileName.toLowerCase().endsWith(".schema.ts") ||
          fileName.toLowerCase().endsWith(".schema.js")
        ) {
          model_count++;
        }

        // Keep code files for route, database, auth discovery
        if (
          fileName.endsWith(".ts") ||
          fileName.endsWith(".js") ||
          fileName.endsWith(".jsx") ||
          fileName.endsWith(".tsx")
        ) {
          try {
            const content = entry.getData().toString("utf8");
            fileContentsToCheck.push({ filePath, content });
          } catch (err) {
            // Ignore decoding issues on large/weird binary files labeled as JS/TS
          }
        }
      }

      // 1. Language Detection
      const language = tsFilesCount > 0 ? "TypeScript" : (jsFilesCount > 0 ? "JavaScript" : "Unknown");

      // 2. Extract Package info & Detect from package.json
      let deps: string[] = [];
      if (packageJsonContent) {
        const d = packageJsonContent.dependencies || {};
        const devD = packageJsonContent.devDependencies || {};
        deps = [...Object.keys(d), ...Object.keys(devD)];
        
        // Framework from dependencies
        if (d["express"] || devD["express"]) {
          framework = "Express";
        } else if (d["@nestjs/core"] || devD["@nestjs/core"]) {
          framework = "NestJS";
        } else if (d["fastify"] || devD["fastify"]) {
          framework = "Fastify";
        }

        // Database from dependencies
        if (d["@supabase/supabase-js"]) {
          database = "Supabase";
        } else if (d["mongoose"] || d["mongodb"]) {
          database = "MongoDB";
        } else if (d["pg"] || d["postgres"]) {
          database = "PostgreSQL";
        } else if (d["mysql2"] || d["mysql"]) {
          database = "MySQL";
        } else if (d["sqlite3"] || d["better-sqlite3"] || d["sqlite"]) {
          database = "SQLite";
        } else if (d["@prisma/client"] || devD["prisma"]) {
          database = "Prisma";
        }

        // Auth from dependencies
        if (d["jsonwebtoken"] || d["jose"]) {
          authentication = "JWT";
        } else if (d["passport"]) {
          authentication = "Passport";
        } else if (d["@supabase/supabase-js"]) {
          authentication = "Supabase Auth";
        } else if (d["firebase-admin"] || d["firebase"]) {
          authentication = "Firebase Auth";
        }
      }

      // 3. Deeper Code Analysis (if not detected in package.json)
      for (const { filePath, content } of fileContentsToCheck) {
        // Express route extraction
        // Look for: router.get(), app.post(), router.patch() etc.
        const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
          const method = match[1].toUpperCase();
          const endpoint = match[2];
          
          // Avoid duplicate routes in the exact same file
          const isDuplicate = routesDiscovered.some(
            (r) => r.method === method && r.endpoint === endpoint && r.sourceFile === filePath
          );
          if (!isDuplicate) {
            routesDiscovered.push({
              method,
              endpoint,
              sourceFile: filePath,
            });
          }
        }

        // Fallback Framework detection from code imports
        if (framework === "Unknown") {
          if (content.includes('from "express"') || content.includes("require('express')") || content.includes('require("express")')) {
            framework = "Express";
          } else if (content.includes("@nestjs/common") || content.includes("@nestjs/core")) {
            framework = "NestJS";
          } else if (content.includes('from "fastify"') || content.includes("require('fastify')") || content.includes('require("fastify")')) {
            framework = "Fastify";
          }
        }

        // Fallback Database detection from code usages
        if (database === "Unknown") {
          if (content.includes("mongoose.connect") || content.includes("mongodb://")) {
            database = "MongoDB";
          } else if (content.includes("new Pool") || content.includes("pg.Pool") || content.includes("postgres://")) {
            database = "PostgreSQL";
          } else if (content.includes("mysql.createConnection") || content.includes("mysql.createPool")) {
            database = "MySQL";
          } else if (content.includes("sqlite3.Database") || content.includes("better-sqlite3")) {
            database = "SQLite";
          } else if (content.includes("PrismaClient")) {
            database = "Prisma";
          } else if (content.includes("supabase.co") || content.includes("createClient(")) {
            // Might be Supabase
            if (content.includes("supabase")) {
              database = "Supabase";
            }
          }
        }

        // Fallback Auth detection from code usages
        if (authentication === "Unknown") {
          if (content.includes("jwt.sign") || content.includes("jwt.verify") || content.includes("jsonwebtoken")) {
            authentication = "JWT";
          } else if (content.includes("passport.authenticate") || content.includes("passport.use")) {
            authentication = "Passport";
          } else if (content.includes("supabase.auth")) {
            authentication = "Supabase Auth";
          } else if (content.includes("admin.auth()") || content.includes("firebase.auth()")) {
            authentication = "Firebase Auth";
          }
        }
      }

      // If still unknown and package.json had supabase-js:
      if (database === "Unknown" && deps.includes("@supabase/supabase-js")) {
        database = "Supabase";
      }
      if (authentication === "Unknown" && deps.includes("@supabase/supabase-js")) {
        authentication = "Supabase Auth";
      }

      const scanResultData = {
        framework,
        language,
        route_count: routesDiscovered.length,
        controller_count,
        middleware_count,
        model_count,
        database,
        authentication,
        analysis_status: "Completed",
        status: "Analyzed", // updates the high-level project status to 'Analyzed' (from 'Empty')
        analysis_completed_at: new Date(),
        routes_discovered: routesDiscovered,
      };

      logger.info(`✅ Intelligent scan completed successfully. Discovered ${routesDiscovered.length} routes.`);
      
      const updatedProject = await dbService.updateProjectScanResults(projectId, userId, scanResultData);
      if (!updatedProject) {
        throw new Error("Failed to save scan results into database.");
      }
      return updatedProject;

    } catch (err: any) {
      logger.error(`❌ Scanner failed for Project ID: ${projectId}. Error: ${err.message}`, err);
      
      await dbService.updateProjectScanResults(projectId, userId, {
        analysis_status: "Failed",
        status: "Error",
      });

      throw err;
    }
  }
}
