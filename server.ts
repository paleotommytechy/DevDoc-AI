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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DevDoc AI Server is running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("\n================================================================================");
    console.error("❌ FULL-STACK PORT / SERVER BOOT ERROR DETECTED:");
    console.error(`Attempted Port: ${PORT}`);
    console.error(`Error Code:     ${err.code}`);
    console.error(`Raw Message:    ${err.message}`);
    console.error("--------------------------------------------------------------------------------");
    if (err.code === "EADDRINUSE") {
      console.error("👉 [DIAGNOSIS: PORT ALREADY IN USE]");
      console.error(`Port ${PORT} is currently being used by another application or process on your host.`);
      console.error("Solution: Please stop the conflicting server, or specify a different PORT environment variable.");
    } else if (err.code === "EACCES") {
      console.error("👉 [DIAGNOSIS: PERMISSION DENIED]");
      console.error(`You do not have administrative permissions to bind to port ${PORT}.`);
      console.error("Solution: Try using a non-privileged port number above 1024, such as 3000.");
    } else {
      console.error("👉 [DIAGNOSIS: GENERAL NETWORK BIND FAILURE]");
      console.error("An unexpected error occurred while setting up the network listener.");
    }
    console.error("================================================================================\n");
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start full-stack server:", err);
  process.exit(1);
});
