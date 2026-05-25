// utils/apiError.js
// A small custom error class so you can throw errors like “User not found” with a proper status code.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;