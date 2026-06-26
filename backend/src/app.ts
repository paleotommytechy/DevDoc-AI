import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { rateLimiter } from "./middlewares/rateLimit.middleware";

const app = express();

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for dev server and preview iframe integration
}));

// Enable CORS with credentials
app.use(cors({
  origin: (origin, callback) => {
    // Permit any origin during dev/testing, supporting iframe environments
    callback(null, true);
  },
  credentials: true,
}));

// Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Development logging
app.use(morgan("dev"));

// Rate limiting
app.use("/api", rateLimiter);

// Mount all API routes
app.use("/api", apiRoutes);

// Handle 404
app.use(notFoundHandler);

// Handle global errors
app.use(errorHandler);

export default app;
