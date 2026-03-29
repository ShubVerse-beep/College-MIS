require("dotenv").config();
const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(env.port, () => {
      console.log(`Backend server listening on port ${env.port}`);
    });

    const gracefulShutdown = async () => {
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    console.error("Failed to start backend server", error);
    process.exit(1);
  }
};

startServer();

