import app from "./app";
import { config } from "./config/index";
import { logger } from "./utils/logger";

const PORT = config.PORT;

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Backend server is running on port ${PORT} in ${config.NODE_ENV} mode`);
});
