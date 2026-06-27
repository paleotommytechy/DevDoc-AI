import { Router } from "express";
import multer from "multer";
import { ScannerController } from "./scanner.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Post route to upload a ZIP codebase and scan it
router.post(
  "/projects/:id/upload",
  authMiddleware as any,
  upload.single("file") as any,
  ScannerController.uploadAndAnalyze as any
);

export default router;
