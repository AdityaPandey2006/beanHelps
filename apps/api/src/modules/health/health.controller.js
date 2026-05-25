const env = require("../../config/env");

const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "BeanHelps API is running",
    environment: env.nodeEnv,
  });
};

module.exports = {
  getHealthStatus,
};
