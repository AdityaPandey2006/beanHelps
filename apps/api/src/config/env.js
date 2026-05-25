// config/env.js
// Reads environment variables and gives the app one clean place to access them.
// This is where things like port, MongoDB URL, and client URL are loaded.
const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["PORT", "MONGODB_URI", "CLIENT_URL", "JWT_SECRET", "JWT_EXPIRES_IN"];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
};

module.exports = env;