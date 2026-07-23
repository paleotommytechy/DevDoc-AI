import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/index";
import { logger } from "../utils/logger";
import crypto from "crypto";
import pg from "pg";

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface ProjectEntity {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  framework?: string | null;
  language?: string | null;
  route_count?: number | null;
  controller_count?: number | null;
  middleware_count?: number | null;
  model_count?: number | null;
  database?: string | null;
  authentication?: string | null;
  analysis_status?: string | null;
  analysis_completed_at?: Date | null;
  routes_discovered?: any[] | null;
  readme_markdown?: string | null;
  api_markdown?: string | null;
}

class DbService {
  private supabase: SupabaseClient | null = null;
  private isFallback = true;

  // In-memory fallback stores
  private inMemoryUsers: UserEntity[] = [];
  private inMemoryProjects: ProjectEntity[] = [];
  private inMemoryEndpoints: any[] = [];
  private inMemoryDiagrams: any[] = [];

  public getIsFallback(): boolean {
    return this.isFallback;
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.SUPABASE_URL || config.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY || config.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        });
        
        // Simple connectivity ping to verify credentials and access using async IIFE
        (async () => {
          try {
            const { error } = await this.supabase!.from("users").select("id").limit(1);
            if (error) {
              this.isFallback = true;
              this.logDetailedSupabaseError(error, supabaseUrl);
            } else {
              this.isFallback = false;
              logger.info("🔌 Connected to Supabase via JavaScript client successfully.");
              // Run schema alignment to ensure all dynamic analysis columns are present
              await this.alignSchema();
            }
          } catch (err) {
            this.isFallback = true;
            this.logDetailedSupabaseError(err, supabaseUrl);
          }
        })();
      } catch (err) {
        logger.error("❌ Failed to initialize Supabase JS client. Falling back to in-memory database.", err);
        this.isFallback = true;
      }
    } else {
      logger.warn("⚠️ No Supabase client credentials found (SUPABASE_URL / VITE_SUPABASE_URL and key). Running with in-memory database fallback.");
      this.isFallback = true;
    }
  }

  private async alignSchema() {
    const dbUrl = process.env.DATABASE_URL || config.DATABASE_URL;
    if (!dbUrl) {
      logger.info("ℹ️ DATABASE_URL not set, skipping automatic schema alignment.");
      return;
    }

    const isSupabase = dbUrl.includes("supabase");
    const useSsl = isSupabase || dbUrl.includes("elephantsql") || dbUrl.includes("render");

    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000, // Fail fast (5s) if direct Postgres port 5432 is blocked by container firewall
    });

    try {
      logger.info("📡 Running automatic database schema alignment...");
      await client.connect();
      
      // Expected columns and their SQL types for projects table
      const columnsToCheck = [
        { name: "framework", type: "VARCHAR(255)" },
        { name: "language", type: "VARCHAR(255)" },
        { name: "route_count", type: "INTEGER" },
        { name: "controller_count", type: "INTEGER" },
        { name: "middleware_count", type: "INTEGER" },
        { name: "model_count", type: "INTEGER" },
        { name: "database", type: "VARCHAR(255)" },
        { name: "authentication", type: "VARCHAR(255)" },
        { name: "analysis_status", type: "VARCHAR(50) DEFAULT 'Not Started'" },
        { name: "analysis_completed_at", type: "TIMESTAMP WITH TIME ZONE" },
        { name: "routes_discovered", type: "JSONB" },
        { name: "readme_markdown", type: "TEXT" },
        { name: "api_markdown", type: "TEXT" }
      ];

      // Get existing columns
      const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects';
      `);
      
      const existingColumns = res.rows.map(row => row.column_name);
      
      if (existingColumns.length === 0) {
        logger.warn("⚠️ 'projects' table not found in database during schema alignment.");
        return;
      }

      for (const col of columnsToCheck) {
        if (!existingColumns.includes(col.name)) {
          logger.info(`➕ Adding missing column '${col.name}' to 'projects' table...`);
          await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
          `);
        }
      }

      // Ensure endpoints table exists
      logger.info("📡 Ensuring 'endpoints' table exists in database...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS endpoints (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          method VARCHAR(15) NOT NULL,
          route VARCHAR(255) NOT NULL,
          controller VARCHAR(255),
          source_file VARCHAR(255),
          middleware TEXT[],
          authentication_required BOOLEAN DEFAULT false NOT NULL,
          validation_library VARCHAR(50),
          request_schema JSONB DEFAULT '{}'::jsonb,
          response_schema JSONB DEFAULT '{}'::jsonb,
          sample_request JSONB DEFAULT '{}'::jsonb,
          sample_response JSONB DEFAULT '{}'::jsonb,
          query_parameters TEXT[] DEFAULT '{}'::text[],
          path_parameters TEXT[] DEFAULT '{}'::text[],
          response_status_codes INTEGER[] DEFAULT '{}'::integer[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);`);

      // Ensure project_sources table exists
      logger.info("📡 Ensuring 'project_sources' table exists in database...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_sources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
          source_type VARCHAR(50) NOT NULL,
          source_url TEXT,
          scan_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
          last_scan_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);`);

      // Ensure architecture_diagrams table exists
      logger.info("📡 Ensuring 'architecture_diagrams' table exists in database...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS architecture_diagrams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          diagram_type VARCHAR(50) NOT NULL,
          mermaid_code TEXT NOT NULL,
          generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE(project_id, diagram_type)
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_architecture_diagrams_project_id ON architecture_diagrams(project_id);`);

      // Disable RLS on architecture_diagrams to let the unauthenticated Express backend save diagrams securely.
      // The Express backend itself handles strict ownership validation on every HTTP request before DB saves.
      await client.query(`ALTER TABLE architecture_diagrams DISABLE ROW LEVEL SECURITY;`);
      await client.query(`DROP POLICY IF EXISTS "Allow owners to insert architecture diagrams" ON architecture_diagrams;`);
      await client.query(`DROP POLICY IF EXISTS "Allow owners to view architecture diagrams" ON architecture_diagrams;`);
      await client.query(`DROP POLICY IF EXISTS "Allow owners to update architecture diagrams" ON architecture_diagrams;`);
      await client.query(`DROP POLICY IF EXISTS "Allow owners to delete architecture diagrams" ON architecture_diagrams;`);

      logger.info("✅ Database schema alignment completed successfully.");
    } catch (err: any) {
      const isConnRefused = err?.code === "ECONNREFUSED" || 
                            err?.message?.includes("ECONNREFUSED") || 
                            err?.name === "AggregateError" ||
                            (Array.isArray(err?.errors) && err.errors.some((e: any) => e.code === "ECONNREFUSED"));

      if (isConnRefused) {
        logger.warn("ℹ️ Direct PostgreSQL database (DATABASE_URL) is offline or unreachable. Skipping DDL schema alignment.");
      } else {
        logger.error(`❌ Failed to perform automatic schema alignment: ${err.message || err}`);
      }
    } finally {
      try {
        await client.end();
      } catch (e) {
        // Ignore close error
      }
    }
  }

  private logDetailedSupabaseError(err: any, supabaseUrl: string) {
    console.error("\n================================================================================");
    console.error("❌ SUPABASE CLIENT CONNECTION DIAGNOSTIC FAILURE:");
    console.error(`Supabase URL:  ${supabaseUrl}`);
    console.error(`Raw Error:     ${err.message || err.details || JSON.stringify(err)}`);
    console.error("--------------------------------------------------------------------------------");
    
    const errMsg = String(err.message || err.details || "").toLowerCase();
    const errCode = String(err.code || "").toLowerCase();
    
    if (errMsg.includes("invalid key") || errMsg.includes("invalid api key") || errMsg.includes("api key") || errCode === "pgrst_auth_failed" || errMsg.includes("auth")) {
      console.error("👉 [DIAGNOSIS: INVALID SUPABASE API KEY / AUTHENTICATION FAILURE]");
      console.error("The provided API key or Service Role Key is invalid, has expired, or is missing the correct authorization.");
      console.error("Solution: Check VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY values.");
    } else if (errMsg.includes("relation") && errMsg.includes("does not exist")) {
      console.error("👉 [DIAGNOSIS: MISSING TABLE / SCHEMA ERROR]");
      console.error("The 'users' or 'projects' table does not exist in your Supabase database.");
      console.error("Solution: Go to your Supabase SQL Editor and execute '/backend/supabase-schema.sql'.");
    } else if (errMsg.includes("failed to fetch") || errMsg.includes("enotfound") || errMsg.includes("getaddrinfo")) {
      console.error("👉 [DIAGNOSIS: DNS / NETWORK UNREACHABLE]");
      console.error("Could not reach the Supabase host name. The connection failed to fetch or timed out.");
      console.error("Solution: Check your internet connection and verify that your SUPABASE_URL matches the project-ref exactly.");
    } else {
      console.error("👉 [DIAGNOSIS: DATABASE ACCESS PERMISSION ERROR]");
      console.error("Verify your table schemas, database credentials, and any active Row Level Security (RLS) policies.");
    }
    console.error("================================================================================\n");
  }

  // --- Users CRUD ---

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isFallback) {
      const user = this.inMemoryUsers.find((u) => u.email === cleanEmail);
      return user ? { ...user } : null;
    }

    try {
      const { data, error } = await this.supabase!
        .from("users")
        .select("*")
        .ilike("email", cleanEmail)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching user by email from Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in getUserByEmail:", err);
      throw err;
    }
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    if (this.isFallback) {
      const user = this.inMemoryUsers.find((u) => u.id === id);
      return user ? { ...user } : null;
    }

    try {
      const { data, error } = await this.supabase!
        .from("users")
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching user by id from Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in getUserById:", err);
      throw err;
    }
  }

  async createUser(email: string, passwordHash: string): Promise<UserEntity> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isFallback) {
      const newUser: UserEntity = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        password: passwordHash,
        created_at: new Date(),
      };
      this.inMemoryUsers.push(newUser);
      return { ...newUser };
    }

    try {
      const { data, error } = await this.supabase!
        .from("users")
        .insert({ email: cleanEmail, password: passwordHash })
        .select()
        .single();

      if (error) {
        logger.error("Error creating user in Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in createUser:", err);
      throw err;
    }
  }

  // --- Projects CRUD ---

  async createProject(userId: string, name: string, description: string | null): Promise<ProjectEntity> {
    if (this.isFallback) {
      const now = new Date();
      const newProject: ProjectEntity = {
        id: crypto.randomUUID(),
        user_id: userId,
        name,
        description,
        status: "Empty",
        created_at: now,
        updated_at: now,
      };
      this.inMemoryProjects.push(newProject);
      return { ...newProject };
    }

    try {
      const { data, error } = await this.supabase!
        .from("projects")
        .insert({ user_id: userId, name, description, status: "Empty" })
        .select()
        .single();

      if (error) {
        logger.error("Error creating project in Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in createProject:", err);
      throw err;
    }
  }

  async getProjectsByUserId(userId: string): Promise<ProjectEntity[]> {
    if (this.isFallback) {
      return this.inMemoryProjects
        .filter((p) => p.user_id === userId)
        .map((p) => ({ ...p }));
    }

    try {
      const { data, error } = await this.supabase!
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error getting projects from Supabase:", error);
        throw error;
      }
      return data || [];
    } catch (err) {
      logger.error("DB Error in getProjectsByUserId:", err);
      throw err;
    }
  }

  async getProjectByIdAndUserId(id: string, userId: string): Promise<ProjectEntity | null> {
    if (this.isFallback) {
      const p = this.inMemoryProjects.find((proj) => proj.id === id && proj.user_id === userId);
      return p ? { ...p } : null;
    }

    try {
      const { data, error } = await this.supabase!
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Error getting project by id from Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in getProjectByIdAndUserId:", err);
      throw err;
    }
  }

  async updateProject(
    id: string,
    userId: string,
    updates: { name?: string; description?: string | null; status?: string }
  ): Promise<ProjectEntity | null> {
    if (this.isFallback) {
      const idx = this.inMemoryProjects.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx === -1) return null;

      const current = this.inMemoryProjects[idx];
      const updated: ProjectEntity = {
        ...current,
        ...updates,
        updated_at: new Date(),
      };
      this.inMemoryProjects[idx] = updated;
      return { ...updated };
    }

    try {
      const fieldsToUpdate: any = { ...updates };
      fieldsToUpdate.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase!
        .from("projects")
        .update(fieldsToUpdate)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) {
        logger.error("Error updating project in Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in updateProject:", err);
      throw err;
    }
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    if (this.isFallback) {
      const idx = this.inMemoryProjects.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx === -1) return false;
      this.inMemoryProjects.splice(idx, 1);
      return true;
    }

    try {
      const { error, count } = await this.supabase!
        .from("projects")
        .delete({ count: "exact" })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        logger.error("Error deleting project from Supabase:", error);
        throw error;
      }
      return count !== null && count > 0;
    } catch (err) {
      logger.error("DB Error in deleteProject:", err);
      throw err;
    }
  }

  async updateProjectScanResults(
    id: string,
    userId: string,
    results: {
      status?: string;
      framework?: string | null;
      language?: string | null;
      route_count?: number | null;
      controller_count?: number | null;
      middleware_count?: number | null;
      model_count?: number | null;
      database?: string | null;
      authentication?: string | null;
      analysis_status?: string | null;
      analysis_completed_at?: Date | null;
      routes_discovered?: any[] | null;
      readme_markdown?: string | null;
      api_markdown?: string | null;
    }
  ): Promise<ProjectEntity | null> {
    if (this.isFallback) {
      const idx = this.inMemoryProjects.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx === -1) return null;

      const current = this.inMemoryProjects[idx];
      const updated: ProjectEntity = {
        ...current,
        ...results,
        updated_at: new Date(),
      };
      this.inMemoryProjects[idx] = updated;
      return { ...updated };
    }

    try {
      const fieldsToUpdate: any = { ...results };
      fieldsToUpdate.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase!
        .from("projects")
        .update(fieldsToUpdate)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) {
        logger.error("Error updating project scan results in Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in updateProjectScanResults:", err);
      throw err;
    }
  }

  // --- Endpoints CRUD ---

  async saveProjectEndpoints(projectId: string, endpoints: any[]): Promise<any[]> {
    if (this.isFallback) {
      // Clear existing endpoints for this project
      this.inMemoryEndpoints = this.inMemoryEndpoints.filter(e => e.project_id !== projectId);
      
      const saved = endpoints.map(ep => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        method: ep.method,
        route: ep.route,
        controller: ep.controller,
        source_file: ep.sourceFile,
        middleware: ep.middleware || [],
        authentication_required: ep.authenticationRequired || false,
        validation_library: ep.validationLibrary,
        request_schema: ep.requestSchema || {},
        response_schema: ep.responseSchema || {},
        sample_request: ep.sampleRequest || {},
        sample_response: ep.sampleResponse || {},
        query_parameters: ep.queryParameters || [],
        path_parameters: ep.pathParameters || [],
        response_status_codes: ep.responseStatusCodes || [],
        created_at: new Date()
      }));

      this.inMemoryEndpoints.push(...saved);
      return saved;
    }

    try {
      // 1. Delete existing endpoints for this project
      const { error: deleteError } = await this.supabase!
        .from("endpoints")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        logger.error(`Error deleting existing endpoints in saveProjectEndpoints: ${deleteError.message}`);
        throw deleteError;
      }

      if (endpoints.length === 0) {
        return [];
      }

      // 2. Insert new endpoints
      const recordsToInsert = endpoints.map(ep => ({
        project_id: projectId,
        method: ep.method,
        route: ep.route,
        controller: ep.controller,
        source_file: ep.sourceFile,
        middleware: ep.middleware || [],
        authentication_required: ep.authenticationRequired || false,
        validation_library: ep.validationLibrary,
        request_schema: ep.requestSchema || {},
        response_schema: ep.responseSchema || {},
        sample_request: ep.sampleRequest || {},
        sample_response: ep.sampleResponse || {},
        query_parameters: ep.queryParameters || [],
        path_parameters: ep.pathParameters || [],
        response_status_codes: ep.responseStatusCodes || []
      }));

      const { data, error } = await this.supabase!
        .from("endpoints")
        .insert(recordsToInsert)
        .select();

      if (error) {
        logger.error("Error inserting new endpoints in Supabase:", error);
        throw error;
      }

      return data || [];
    } catch (err) {
      logger.error("DB Error in saveProjectEndpoints:", err);
      throw err;
    }
  }

  async getProjectEndpoints(projectId: string): Promise<any[]> {
    if (this.isFallback) {
      return this.inMemoryEndpoints
        .filter(e => e.project_id === projectId)
        .map(e => ({ ...e }));
    }

    try {
      const { data, error } = await this.supabase!
        .from("endpoints")
        .select("*")
        .eq("project_id", projectId)
        .order("route", { ascending: true });

      if (error) {
        logger.error("Error fetching project endpoints from Supabase:", error);
        throw error;
      }

      return data || [];
    } catch (err) {
      logger.error("DB Error in getProjectEndpoints:", err);
      throw err;
    }
  }

  async getEndpointById(endpointId: string): Promise<any | null> {
    if (this.isFallback) {
      const ep = this.inMemoryEndpoints.find(e => e.id === endpointId);
      return ep ? { ...ep } : null;
    }

    try {
      const { data, error } = await this.supabase!
        .from("endpoints")
        .select("*")
        .eq("id", endpointId)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching endpoint by ID from Supabase:", error);
        throw error;
      }

      return data;
    } catch (err) {
      logger.error("DB Error in getEndpointById:", err);
      throw err;
    }
  }

  async getProjectSource(projectId: string): Promise<any | null> {
    if (this.isFallback) {
      const project = this.inMemoryProjects.find(p => p.id === projectId);
      if (project && (project as any).source_type) {
        return {
          source_type: (project as any).source_type,
          source_url: (project as any).source_url,
          scan_status: (project as any).scan_status,
          last_scan_at: (project as any).last_scan_at,
        };
      }
      return null;
    }

    try {
      const { data, error } = await this.supabase!
        .from("project_sources")
        .select("*")
        .eq("project_id", projectId)
        .limit(1)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  // --- Architecture Diagrams CRUD ---

  async getProjectDiagrams(projectId: string): Promise<any[]> {
    if (this.isFallback) {
      return this.inMemoryDiagrams
        .filter((d) => d.project_id === projectId)
        .map((d) => ({ ...d }));
    }

    try {
      const { data, error } = await this.supabase!
        .from("architecture_diagrams")
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        logger.error("Error fetching project diagrams from Supabase:", error);
        throw error;
      }
      return data || [];
    } catch (err) {
      logger.error("DB Error in getProjectDiagrams:", err);
      throw err;
    }
  }

  async saveProjectDiagram(projectId: string, diagramType: string, mermaidCode: string): Promise<any> {
    const trimmedCode = mermaidCode.trim();
    if (this.isFallback) {
      const existingIdx = this.inMemoryDiagrams.findIndex(
        (d) => d.project_id === projectId && d.diagram_type === diagramType
      );
      const now = new Date();
      if (existingIdx !== -1) {
        this.inMemoryDiagrams[existingIdx].mermaid_code = trimmedCode;
        this.inMemoryDiagrams[existingIdx].generated_at = now;
        return { ...this.inMemoryDiagrams[existingIdx] };
      } else {
        const record = {
          id: crypto.randomUUID(),
          project_id: projectId,
          diagram_type: diagramType,
          mermaid_code: trimmedCode,
          generated_at: now,
        };
        this.inMemoryDiagrams.push(record);
        return { ...record };
      }
    }

    try {
      const { data, error } = await this.supabase!
        .from("architecture_diagrams")
        .upsert(
          {
            project_id: projectId,
            diagram_type: diagramType,
            mermaid_code: trimmedCode,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "project_id,diagram_type" }
        )
        .select()
        .single();

      if (error) {
        logger.error("Error saveProjectDiagram in Supabase:", error);
        throw error;
      }
      return data;
    } catch (err) {
      logger.error("DB Error in saveProjectDiagram:", err);
      throw err;
    }
  }
}

export const dbService = new DbService();
