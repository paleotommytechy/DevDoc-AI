import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbService, UserEntity } from "./db.service";

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
   * Verifies a signed JWT token
   */
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * Register a new user
   */
  static async register(email: string, passwordPlain: string): Promise<Omit<UserEntity, "password">> {
    const existing = await dbService.getUserByEmail(email);
    if (existing) {
      const error = new Error("Email is already registered") as any;
      error.status = 400;
      throw error;
    }

    const hashedPassword = await this.hashPassword(passwordPlain);
    const user = await dbService.createUser(email, hashedPassword);

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }

  /**
   * Login user and return JWT + User data
   */
  static async login(
    email: string,
    passwordPlain: string
  ): Promise<{ token: string; user: Omit<UserEntity, "password"> }> {
    const user = await dbService.getUserByEmail(email);
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
  }

  /**
   * Retrieve current user profile
   */
  static async getProfile(userId: string): Promise<Omit<UserEntity, "password">> {
    const user = await dbService.getUserById(userId);
    if (!user) {
      const error = new Error("User not found") as any;
      error.status = 404;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }
}
