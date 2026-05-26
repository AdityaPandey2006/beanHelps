// middleware/auth.js
// Checks JWT token and confirms the user is logged in.
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils/apiError");
const User = require("../../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No token provided"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new ApiError(401, "User no longer exists"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = auth;


// What the request (req) will look like
// Before middleware
// req = {
//    headers:{
//       authorization:
//       "Bearer eyJhbGciOiJIUz..."
//    },

//    body:{},

//    params:{},

//    query:{}
// }

// After JWT verified and user attached
// req = {
//    headers:{
//       authorization:
//       "Bearer eyJhbGciOiJIUz..."
//    },

//    body:{},

//    params:{},

//    query:{},

//    user:{
//       _id:"68452ab1234",
//       name:"John",
//       email:"john@gmail.com"
//    }
// }
