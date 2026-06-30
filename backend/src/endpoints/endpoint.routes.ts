import { Router } from "express";
import { EndpointController } from "./endpoint.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Retrieve all endpoints discovered for a project
router.get(
  "/projects/:projectId/endpoints",
  authMiddleware as any,
  EndpointController.getProjectEndpoints as any
);

// Retrieve details for a single endpoint
router.get(
  "/endpoints/:endpointId",
  authMiddleware as any,
  EndpointController.getEndpointDetails as any
);

export default router;
