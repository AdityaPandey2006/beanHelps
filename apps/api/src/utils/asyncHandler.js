// utils/asyncHandler.js
// Helps wrap async route handlers so you do not repeat try/catch everywhere.
const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;