import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Apply auth middleware to all project endpoints
router.use(authMiddleware as any);

router.post("/projects/demo", ProjectController.createDemo as any);
router.post("/projects", ProjectController.create as any);
router.get("/projects", ProjectController.getMyProjects as any);
router.get("/projects/:id", ProjectController.getOne as any);
router.put("/projects/:id", ProjectController.update as any);
router.delete("/projects/:id", ProjectController.delete as any);

export default router;
