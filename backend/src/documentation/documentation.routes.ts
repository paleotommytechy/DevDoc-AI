import { Router } from "express";
import { DocumentationController } from "./documentation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Apply auth middleware to ensure only project owners can view or download docs
router.use(authMiddleware as any);

router.get("/projects/:id/documentation", DocumentationController.getDocumentation as any);
router.get("/projects/:id/documentation/download/readme", DocumentationController.downloadReadme as any);
router.get("/projects/:id/documentation/download/api", DocumentationController.downloadApi as any);
router.get("/projects/:id/documentation/download/openapi", DocumentationController.downloadOpenApi as any);
router.get("/projects/:id/documentation/download/postman", DocumentationController.downloadPostman as any);

export default router;
