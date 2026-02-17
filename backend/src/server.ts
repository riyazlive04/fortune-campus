import app from "./app";
import { config } from "./config";

/**
 * Start HTTP server
 * (Force restart)
 * IMPORTANT:
 * - Do NOT force Prisma connection on startup
 * - Prisma will connect lazily on first query
 * - This avoids startup crashes due to DB/network issues
 */
const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS enabled for: ${config.cors.origin}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

/**
 * Graceful shutdown
 * Prisma will auto-disconnect when process exits
 * Explicit disconnect is NOT required here
 */
process.on("SIGINT", () => {
  console.log("\n⏳ Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⏳ Shutting down gracefully...");
  process.exit(0);
});