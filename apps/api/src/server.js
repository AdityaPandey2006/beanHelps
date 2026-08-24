const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const startSelfPing = require("./utils/selfPing");

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    startSelfPing({
      url: env.selfPingUrl,
      intervalMs: env.selfPingIntervalMs,
    });
  });
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exitCode = 1;
});
