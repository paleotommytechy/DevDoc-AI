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
}

class DbService {
  private supabase: SupabaseClient | null = null;
  private isFallback = true;

  // In-memory fallback stores
  private inMemoryUsers: UserEntity[] = [];
  private inMemoryProjects: ProjectEntity[] = [];

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
        { name: "routes_discovered", type: "JSONB" }
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
      logger.info("✅ Database schema alignment completed successfully.");
    } catch (err) {
      logger.error("❌ Failed to perform automatic schema alignment:", err);
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
}

export const dbService = new DbService();
