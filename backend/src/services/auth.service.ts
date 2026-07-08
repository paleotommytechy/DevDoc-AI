import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbService, UserEntity } from "./db.service";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "devdoc_ai_secret_key_change_me_in_prod";
const JWT_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  /**
   * Hashes a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain password with hashed password
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates a signed JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verifies a signed JWT token or Supabase Auth access token
   */
  static async verifyToken(token: string): Promise<TokenPayload> {
    if (dbService.getIsFallback()) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
      } catch (err: any) {
        const error = new Error("Invalid or expired session token") as any;
        error.status = 401;
        throw error;
      }
    } else {
      const supabase = dbService.getSupabaseClient()!;
      try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
          const errMessage = error ? error.message : "Invalid token or user not found";
          const customErr = new Error(`Session expired or invalid token: ${errMessage}`) as any;
          customErr.status = 401;
          throw customErr;
        }

        return {
          userId: data.user.id,
          email: data.user.email || "",
        };
      } catch (err: any) {
        const customErr = new Error(`Authentication token verification failed: ${err.message}`) as any;
        customErr.status = 401;
        throw customErr;
      }
    }
  }

  /**
   * Register a new user
   */
  static async register(email: string, passwordPlain: string): Promise<Omit<UserEntity, "password">> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await dbService.getUserByEmail(cleanEmail);
    if (existing) {
      const error = new Error("Email is already registered") as any;
      error.status = 400;
      throw error;
    }

    if (dbService.getIsFallback()) {
      const hashedPassword = await this.hashPassword(passwordPlain);
      const user = await dbService.createUser(cleanEmail, hashedPassword);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      };
    } else {
      const supabase = dbService.getSupabaseClient()!;
      
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: passwordPlain,
      });

      if (authError) {
        const error = new Error(authError.message) as any;
        error.status = authError.status || 400;
        throw error;
      }

      if (!authData.user) {
        throw new Error("Failed to register user in Supabase Auth.");
      }

      // 2. Insert into public.users table to preserve foreign key constraints and standard user profiles
      try {
        const { data: userData, error: dbError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id, // Ensure identical UUID as Supabase Auth
            email: cleanEmail,
            password: "supabase_managed", // Satisfies NOT NULL in schema securely
          })
          .select()
          .single();

        if (dbError) {
          logger.error("Error creating profile in public users table:", dbError);
          throw dbError;
        }

        return {
          id: userData.id,
          email: userData.email,
          created_at: new Date(userData.created_at),
        };
      } catch (dbErr: any) {
        logger.error("DB insertion failed after successful Auth registration:", dbErr);
        throw dbErr;
      }
    }
  }

  /**
   * Login user and return JWT + User data
   */
  static async login(
    email: string,
    passwordPlain: string
  ): Promise<{ token: string; user: Omit<UserEntity, "password"> }> {
    const cleanEmail = email.toLowerCase().trim();

    if (dbService.getIsFallback()) {
      const user = await dbService.getUserByEmail(cleanEmail);
      if (!user) {
        const error = new Error("Invalid email or password") as any;
        error.status = 401;
        throw error;
      }

      const passwordMatches = await this.comparePassword(passwordPlain, user.password);
      if (!passwordMatches) {
        const error = new Error("Invalid email or password") as any;
        error.status = 401;
        throw error;
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
      };

      const token = this.generateToken(payload);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
      };
    } else {
      const supabase = dbService.getSupabaseClient()!;

      // 1. Sign in with password via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordPlain,
      });

      if (authError) {
        const error = new Error(authError.message) as any;
        error.status = authError.status || 401;
        throw error;
      }

      if (!authData.session || !authData.user) {
        const error = new Error("Login failed. No session was returned from Supabase.") as any;
        error.status = 401;
        throw error;
      }

      // 2. Fetch or auto-create/self-heal corresponding record in public.users
      let dbUser = await dbService.getUserById(authData.user.id);
      if (!dbUser) {
        logger.info(`Self-healing missing public user profile for authenticated user: ${authData.user.id}`);
        const { data: healedUser, error: healError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: cleanEmail,
            password: "supabase_managed",
          })
          .select()
          .single();

        if (healError) {
          logger.error("Failed to self-heal public user profile on login:", healError);
          throw healError;
        }
        dbUser = healedUser;
      }

      return {
        token: authData.session.access_token,
        user: {
          id: dbUser!.id,
          email: dbUser!.email,
          created_at: new Date(dbUser!.created_at),
        },
      };
    }
  }

  /**
   * Retrieve current user profile
   */
  static async getProfile(userId: string): Promise<Omit<UserEntity, "password">> {
    const user = await dbService.getUserById(userId);
    if (!user) {
      const error = new Error("User profile not found") as any;
      error.status = 404;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      created_at: new Date(user.created_at),
    };
  }
}
