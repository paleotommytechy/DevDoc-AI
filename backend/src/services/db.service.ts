import pg from "pg";
import { config } from "../config/index";
import { logger } from "../utils/logger";
import crypto from "crypto";

const { Pool } = pg;

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
}

class DbService {
  private pool: pg.Pool | null = null;
  private isFallback = true;

  // In-memory fallback stores
  private inMemoryUsers: UserEntity[] = [];
  private inMemoryProjects: ProjectEntity[] = [];

  constructor() {
    const dbUrl = process.env.DATABASE_URL || config.DATABASE_URL;
    if (dbUrl) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: dbUrl.includes("supabase") || dbUrl.includes("elephantsql") || dbUrl.includes("render")
            ? { rejectUnauthorized: false }
            : false,
        });
        this.isFallback = false;
        logger.info("🔌 Connected to PostgreSQL/Supabase database successfully.");
      } catch (err) {
        logger.error("❌ Failed to initialize PostgreSQL pool. Falling back to in-memory database.", err);
        this.isFallback = true;
      }
    } else {
      logger.warn("⚠️ No DATABASE_URL found in environment. Running with in-memory database fallback.");
      this.isFallback = true;
    }
  }

  // --- Users CRUD ---

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isFallback) {
      const user = this.inMemoryUsers.find((u) => u.email === cleanEmail);
      return user ? { ...user } : null;
    }

    const query = "SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1";
    const res = await this.pool!.query(query, [cleanEmail]);
    return res.rows[0] || null;
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    if (this.isFallback) {
      const user = this.inMemoryUsers.find((u) => u.id === id);
      return user ? { ...user } : null;
    }

    const query = "SELECT * FROM users WHERE id = $1 LIMIT 1";
    const res = await this.pool!.query(query, [id]);
    return res.rows[0] || null;
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

    const query = `
      INSERT INTO users (email, password)
      VALUES ($1, $2)
      RETURNING *
    `;
    const res = await this.pool!.query(query, [cleanEmail, passwordHash]);
    return res.rows[0];
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

    const query = `
      INSERT INTO projects (user_id, name, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await this.pool!.query(query, [userId, name, description, "Empty"]);
    return res.rows[0];
  }

  async getProjectsByUserId(userId: string): Promise<ProjectEntity[]> {
    if (this.isFallback) {
      return this.inMemoryProjects
        .filter((p) => p.user_id === userId)
        .map((p) => ({ ...p }));
    }

    const query = "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC";
    const res = await this.pool!.query(query, [userId]);
    return res.rows;
  }

  async getProjectByIdAndUserId(id: string, userId: string): Promise<ProjectEntity | null> {
    if (this.isFallback) {
      const p = this.inMemoryProjects.find((proj) => proj.id === id && proj.user_id === userId);
      return p ? { ...p } : null;
    }

    const query = "SELECT * FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1";
    const res = await this.pool!.query(query, [id, userId]);
    return res.rows[0] || null;
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

    const setFields: string[] = [];
    const values: any[] = [id, userId];
    let counter = 3;

    if (updates.name !== undefined) {
      setFields.push(`name = $${counter++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setFields.push(`description = $${counter++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setFields.push(`status = $${counter++}`);
      values.push(updates.status);
    }

    if (setFields.length === 0) {
      return this.getProjectByIdAndUserId(id, userId);
    }

    // Always update updated_at
    setFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE projects
      SET ${setFields.join(", ")}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const res = await this.pool!.query(query, values);
    return res.rows[0] || null;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    if (this.isFallback) {
      const idx = this.inMemoryProjects.findIndex((p) => p.id === id && p.user_id === userId);
      if (idx === -1) return false;
      this.inMemoryProjects.splice(idx, 1);
      return true;
    }

    const query = "DELETE FROM projects WHERE id = $1 AND user_id = $2";
    const res = await this.pool!.query(query, [id, userId]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const dbService = new DbService();
