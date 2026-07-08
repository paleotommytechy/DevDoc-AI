import { Router } from "express";
import { ArchitectureController } from "./architecture.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Retrieve all architecture diagrams for a project
router.get(
  "/projects/:id/architecture",
  authMiddleware as any,
  ArchitectureController.getDiagrams as any
);

// Forcefully regenerate all architecture diagrams for a project
router.post(
  "/projects/:id/architecture/regenerate",
  authMiddleware as any,
  ArchitectureController.regenerateDiagrams as any
);

export default router;
