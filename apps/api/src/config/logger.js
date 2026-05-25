// config/logger.js
// Stores logging setup.
// For now this can be very simple. Later, if you move from console.log to a proper logger, you won’t need to change the whole app.
const env = require("./env");

const formatMessage = (level, message, meta = {}) => {
  return {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };
};
//logger is a collection of different ways of using console.log
// call as required
const logger = {
  info: (message, meta = {}) => {
    console.log(formatMessage("info", message, meta));
  },

  warn: (message, meta = {}) => {
    console.warn(formatMessage("warn", message, meta));
  },

  error: (message, meta = {}) => {
    console.error(formatMessage("error", message, meta));
  },

  debug: (message, meta = {}) => {
    if (env.nodeEnv === "development") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};

module.exports = logger;