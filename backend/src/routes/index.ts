import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import scannerRoutes from "../scanner/scanner.routes";

const router = Router();

// Mount API endpoints
router.use("/", healthRoutes);
router.use("/", authRoutes);
router.use("/", projectRoutes);
router.use("/", scannerRoutes);

export default router;
