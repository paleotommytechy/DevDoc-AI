import app from "./app";
import { config } from "./config/index";
import { logger } from "./utils/logger";

const PORT = config.PORT;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Backend server is running on port ${PORT} in ${config.NODE_ENV} mode`);
});

server.on("error", (err: any) => {
  console.error("\n================================================================================");
  console.error("❌ BACKEND PORT / SERVER BOOT ERROR DETECTED:");
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
