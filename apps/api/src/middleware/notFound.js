// middleware/notFound.js
// Runs when a route does not exist, like /abcxyz.
// It sends a clean 404 response.
const ApiError = require("../utils/apiError");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = notFound;