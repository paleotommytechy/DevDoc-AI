import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./backend/src/app";
import { config } from "./backend/src/config/index";

const PORT = config.PORT || 3000;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.join(process.cwd(), "frontend/vite.config.ts"),
    });
    // Mount Vite middleware after backend routes
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting server in production mode serving static client assets...");
    const distPath = path.join(process.cwd(), "frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DevDoc AI Server is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start full-stack server:", err);
  process.exit(1);
});
