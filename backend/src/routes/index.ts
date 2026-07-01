import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import scannerRoutes from "../scanner/scanner.routes";
import documentationRoutes from "../documentation/documentation.routes";
import endpointRoutes from "../endpoints/endpoint.routes";
import urlAnalysisRoutes from "../url-analysis/urlAnalysis.routes";

const router = Router();

// Mount API endpoints
router.use("/", healthRoutes);
router.use("/", authRoutes);
router.use("/", projectRoutes);
router.use("/", scannerRoutes);
router.use("/", documentationRoutes);
router.use("/", endpointRoutes);
router.use("/", urlAnalysisRoutes);

export default router;
