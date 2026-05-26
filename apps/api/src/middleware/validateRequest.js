// What this validation middleware does:

// checks required fields
// checks type like string or number
// checks min/max text length
// checks allowed values using enum
//basically before the api call, it checks if the fields in
//a particular api call are valid or not

const ApiError = require("../utils/apiError");
//validateRequest takes in the kind of request schema that is required
//for a particular api.
//then, checks if the actual req is valid or not
const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];

    Object.entries(schema).forEach(([field, rules]) => {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
        return;
      }

      if (value === undefined || value === null) {
        return;
      }

      if (rules.type === "array" && !Array.isArray(value)) {
        errors.push(`${field} must be an array`);
      }

      if (rules.type && rules.type !== "array" && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}`);
      }

      if (rules.minLength && typeof value === "string" && value.trim().length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === "string" && value.trim().length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters long`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
      }

      if (rules.itemType && Array.isArray(value)) {
        const hasInvalidItem = value.some((item) => typeof item !== rules.itemType);

        if (hasInvalidItem) {
          errors.push(`${field} must contain only ${rules.itemType} values`);
        }
      }
    });

    if (errors.length > 0) {
      return next(new ApiError(400, errors.join(". ")));
    }

    next();//if a request passes the validation, the system moves onto the the actual next function to be executed
  };
};

module.exports = validateRequest;
