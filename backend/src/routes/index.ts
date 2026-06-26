import { Router } from "express";
import healthRoutes from "./health.routes";

const router = Router();

// Mount API endpoints
router.use("/", healthRoutes);

export default router;
