import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";

const router = Router();

// Mount API endpoints
router.use("/", healthRoutes);
router.use("/", authRoutes);
router.use("/", projectRoutes);

export default router;
