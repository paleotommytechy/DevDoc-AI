import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = "";

    // 1. Try to read from cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // 2. Try to read from Authorization Header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
      return;
    }

    const decoded = await AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    logger.warn(`Failed authentication attempt: ${err.message}`);
    res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please login again.",
    });
  }
};
