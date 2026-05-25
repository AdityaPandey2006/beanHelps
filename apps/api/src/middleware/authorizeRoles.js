// middleware/authorizeRoles.js
// Allows only certain roles to access a route, 
// like only beanpist or admin.
const ApiError = require("../utils/apiError");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
//if let's say a non-therapist tries to access a particular route, 
// they wont be allowed to do it
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You are not allowed to access this resource"));
    }

    next();
    //if the user is allowed to access that route, 
    //the next function is carried out
  };
};

module.exports = authorizeRoles;