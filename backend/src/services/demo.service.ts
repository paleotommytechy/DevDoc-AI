import { dbService, ProjectEntity } from "./db.service";
import { logger } from "../utils/logger";

export class DemoService {
  /**
   * Seeds an instant, interactive Demo Project for any visitor (or user).
   */
  static async createDemoProject(userId: string): Promise<ProjectEntity> {
    logger.info(`✨ Seeding interactive 1-Click Demo Project for user: ${userId}`);

    const demoProject = await dbService.createProject(
      userId,
      "⚡ E-Commerce REST API (Demo)",
      "High-performance production REST API microservice scanned with DevDoc AI AST static analysis."
    );

    const projectId = demoProject.id;

    // Detailed Demo Endpoints
    const demoEndpoints = [
      {
        method: "POST",
        route: "/api/v1/auth/register",
        sourceFile: "src/controllers/auth.controller.ts",
        controller: "AuthController.register",
        middleware: ["rateLimiter", "validate(registerSchema)"],
        authenticationRequired: false,
        validationLibrary: "Zod",
        requestSchema: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string" },
            password: { type: "string" },
            role: { type: "string" }
          }
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            token: { type: "string" },
            user: { type: "object" }
          }
        },
        sampleRequest: {
          fullName: "Dev Engine User",
          email: "dev@example.com",
          password: "SecurePassword123!",
          role: "developer"
        },
        sampleResponse: {
          success: true,
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          user: { id: "usr_9981", name: "Dev Engine User", email: "dev@example.com" }
        },
        queryParameters: [],
        pathParameters: [],
        responseStatusCodes: [201, 400, 409, 500]
      },
      {
        method: "POST",
        route: "/api/v1/auth/login",
        sourceFile: "src/controllers/auth.controller.ts",
        controller: "AuthController.login",
        middleware: ["rateLimiter"],
        authenticationRequired: false,
        validationLibrary: "Zod",
        requestSchema: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" }
          }
        },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            token: { type: "string" }
          }
        },
        sampleRequest: {
          email: "dev@example.com",
          password: "SecurePassword123!"
        },
        sampleResponse: {
          success: true,
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        },
        queryParameters: [],
        pathParameters: [],
        responseStatusCodes: [200, 401, 500]
      },
      {
        method: "GET",
        route: "/api/v1/products",
        sourceFile: "src/controllers/product.controller.ts",
        controller: "ProductController.listProducts",
        middleware: ["cacheMiddleware(300)"],
        authenticationRequired: false,
        validationLibrary: null,
        requestSchema: { type: "object", properties: {} },
        responseSchema: {
          type: "object",
          properties: {
            products: { type: "array" },
            total: { type: "number" },
            page: { type: "number" }
          }
        },
        sampleRequest: {},
        sampleResponse: {
          products: [
            { id: "prod_1", title: "Ultra Developer Mechanical Keyboard", price: 149.99, category: "Hardware" },
            { id: "prod_2", title: "4K Ergonomic Curved Display", price: 499.00, category: "Monitors" }
          ],
          total: 42,
          page: 1
        },
        queryParameters: ["page", "limit", "category", "search"],
        pathParameters: [],
        responseStatusCodes: [200, 500]
      },
      {
        method: "GET",
        route: "/api/v1/products/:id",
        sourceFile: "src/controllers/product.controller.ts",
        controller: "ProductController.getProductById",
        middleware: [],
        authenticationRequired: false,
        validationLibrary: null,
        requestSchema: { type: "object", properties: {} },
        responseSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" }
          }
        },
        sampleRequest: {},
        sampleResponse: {
          id: "prod_1",
          title: "Ultra Developer Mechanical Keyboard",
          price: 149.99,
          stock: 15
        },
        queryParameters: [],
        pathParameters: ["id"],
        responseStatusCodes: [200, 404, 500]
      },
      {
        method: "POST",
        route: "/api/v1/orders",
        sourceFile: "src/controllers/order.controller.ts",
        controller: "OrderController.createOrder",
        middleware: ["authGuard", "validate(orderSchema)"],
        authenticationRequired: true,
        validationLibrary: "Zod",
        requestSchema: {
          type: "object",
          properties: {
            items: { type: "array" },
            shippingAddress: { type: "object" },
            paymentMethod: { type: "string" }
          }
        },
        responseSchema: {
          type: "object",
          properties: {
            orderId: { type: "string" },
            status: { type: "string" },
            totalAmount: { type: "number" }
          }
        },
        sampleRequest: {
          items: [{ productId: "prod_1", quantity: 2 }],
          shippingAddress: { street: "100 Dev Avenue", city: "San Francisco", zip: "94107" },
          paymentMethod: "stripe"
        },
        sampleResponse: {
          orderId: "ord_99011",
          status: "processing",
          totalAmount: 299.98
        },
        queryParameters: [],
        pathParameters: [],
        responseStatusCodes: [201, 400, 401, 500]
      },
      {
        method: "DELETE",
        route: "/api/v1/orders/:id",
        sourceFile: "src/controllers/order.controller.ts",
        controller: "OrderController.cancelOrder",
        middleware: ["authGuard", "requireAdmin"],
        authenticationRequired: true,
        validationLibrary: null,
        requestSchema: { type: "object", properties: {} },
        responseSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        },
        sampleRequest: {},
        sampleResponse: {
          success: true,
          message: "Order ord_99011 successfully cancelled."
        },
        queryParameters: [],
        pathParameters: ["id"],
        responseStatusCodes: [200, 401, 403, 404, 500]
      }
    ];

    await dbService.saveProjectEndpoints(projectId, demoEndpoints);

    const routesDiscovered = demoEndpoints.map(e => ({
      method: e.method,
      endpoint: e.route,
      sourceFile: e.sourceFile
    }));

    const readmeMarkdown = `# ⚡ E-Commerce REST API (Demo Project)

## Description
Production-ready microservice backend for user authentication, product catalog management, and order processing.

## Technology Stack
- **Framework:** Express
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** Bearer JWT Token

## Codebase Metrics
- **Discovered Endpoints:** 6
- **Controllers:** 3
- **Models / Schemas:** 4
- **Middlewares:** 5

*Scanned instantly with DevDoc AI AST Engine.*
`;

    const apiMarkdown = `# E-Commerce REST API - API Reference Manual

## Overview
Auto-compiled REST endpoint specification generated via static code parsing.

## Discovered API Endpoints

| HTTP Method | Route Endpoint | Controller | Source File |
| :--- | :--- | :--- | :--- |
| \`POST\` | \`/api/v1/auth/register\` | \`AuthController.register\` | \`src/controllers/auth.controller.ts\` |
| \`POST\` | \`/api/v1/auth/login\` | \`AuthController.login\` | \`src/controllers/auth.controller.ts\` |
| \`GET\` | \`/api/v1/products\` | \`ProductController.listProducts\` | \`src/controllers/product.controller.ts\` |
| \`GET\` | \`/api/v1/products/:id\` | \`ProductController.getProductById\` | \`src/controllers/product.controller.ts\` |
| \`POST\` | \`/api/v1/orders\` | \`OrderController.createOrder\` | \`src/controllers/order.controller.ts\` |
| \`DELETE\` | \`/api/v1/orders/:id\` | \`OrderController.cancelOrder\` | \`src/controllers/order.controller.ts\` |
`;

    const updatedProject = await dbService.updateProjectScanResults(projectId, userId, {
      framework: "Express",
      language: "TypeScript",
      route_count: demoEndpoints.length,
      controller_count: 3,
      middleware_count: 5,
      model_count: 4,
      database: "PostgreSQL",
      authentication: "JWT",
      analysis_status: "Completed",
      status: "Analyzed",
      analysis_completed_at: new Date(),
      routes_discovered: routesDiscovered,
      readme_markdown: readmeMarkdown,
      api_markdown: apiMarkdown
    });

    return updatedProject || demoProject;
  }
}
