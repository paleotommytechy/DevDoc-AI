import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger"; // Note: TS uses relative/config alias paths

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Detailed developer diagnosis in the backend console
  console.error("\n================================================================================");
  console.error("🚨 BACKEND API ROUTE ERROR DETECTED:");
  console.error(`Route:       ${req.method} ${req.originalUrl}`);
  console.error(`Status Code: ${status}`);
  console.error(`Error Class: ${err.constructor?.name || "Error"}`);
  console.error(`Raw Message: ${message}`);
  console.error("--------------------------------------------------------------------------------");

  // Perform precise diagnostics on the backend error source
  const errStr = (err.message || "").toLowerCase() + " " + (err.stack || "").toLowerCase();
  
  if (errStr.includes("supabase") || errStr.includes("postgres") || errStr.includes("pg-pool") || errStr.includes("relation") || errStr.includes("query") || errStr.includes("db.service") || (err as any).code?.startsWith("08") || (err as any).code?.startsWith("28") || (err as any).code?.startsWith("3D")) {
    console.error("👉 [DIAGNOSIS: DATABASE/SUPABASE ERROR]");
    console.error("The error originated during a database operation (PostgreSQL/Supabase).");
    
    if (errStr.includes("relation") && errStr.includes("does not exist")) {
      console.error("  ℹ️ Tip: A required database table is missing. Run the schema migrations from '/backend/supabase-schema.sql'.");
    } else if (errStr.includes("column") && errStr.includes("does not exist")) {
      console.error("  ℹ️ Tip: There is a schema mismatch. A column accessed does not exist in the database table.");
    } else if (errStr.includes("self-signed certificate")) {
      console.error("  ℹ️ Tip: SSL validation issue. Ensure DATABASE_URL ends with '?sslmode=require' or verify certificate configuration.");
    } else if (errStr.includes("password authentication failed")) {
      console.error("  ℹ️ Tip: Database credentials issue. The password in DATABASE_URL is incorrect or expired.");
    } else {
      console.error("  ℹ️ Tip: Ensure your DATABASE_URL is correctly set and your database is online (not paused).");
    }
  } else if (status === 401) {
    console.error("👉 [DIAGNOSIS: AUTHENTICATION / SESSION FAILURE]");
    console.error("The request lacks valid authentication. The JWT token is either missing, expired, or tampered with.");
    console.error("Action: Instruct the user to log in again to refresh their session credentials.");
  } else if (status === 403) {
    console.error("👉 [DIAGNOSIS: AUTHORIZATION FAILURE]");
    console.error("The request is authenticated, but the user does not have permission to access or modify the specified resource.");
  } else if (status === 400 || status === 422) {
    console.error("👉 [DIAGNOSIS: BAD REQUEST / VALIDATION FAILURE]");
    console.error("The error stems from invalid or incomplete user input (e.g. invalid fields in form or JSON body).");
  } else if (status === 429) {
    console.error("👉 [DIAGNOSIS: RATE LIMIT EXCEEDED]");
    console.error("This request was throttled because the client sent too many requests in a short time frame.");
  } else if (errStr.includes("multer") || errStr.includes("upload")) {
    console.error("👉 [DIAGNOSIS: FILE UPLOAD / MULTER ERROR]");
    console.error("The error occurred during a codebase upload or multipart form parsing.");
  } else {
    console.error("👉 [DIAGNOSIS: SYSTEM RUNTIME EXCEPTION]");
    console.error("An unhandled error occurred in the backend application server.");
  }

  if (err.stack) {
    console.error(`\nStack Trace:\n${err.stack}`);
  }
  console.error("================================================================================");

  // Still use standard logger for file/external logging if configured
  logger.error(`API Error: ${message} (Status: ${status})`, err);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
