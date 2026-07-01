import { Router } from "express";
import { UrlAnalysisController } from "./urlAnalysis.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Route to analyze a running backend URL
router.post(
  "/projects/:id/analyze-url",
  authMiddleware as any,
  UrlAnalysisController.analyze as any
);

export default router;
