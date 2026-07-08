import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";

// Zod validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const COOKIE_NAME = "token";

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true, // Always true to support sameSite: "none" in the HTTPS iframe environment
    sameSite: "none", // Must be "none" to allow cross-site cookie transmission inside the iframe
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

export class AuthController {
  /**
   * User Registration
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed",
        });
        return;
      }

      const { email, password } = validation.data;
      const newUser = await AuthService.register(email, password);

      // Log them in immediately upon registration
      const { token } = await AuthService.login(email, password);
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: newUser,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User Login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed",
        });
        return;
      }

      const { email, password } = validation.data;
      const { token, user } = await AuthService.login(email, password);
      
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User Logout
   */
  static logout(req: Request, res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }

  /**
   * Get Active User Profile
   */
  static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
        return;
      }

      const profile = await AuthService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          user: profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
