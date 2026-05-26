// auth.controller.js
// Handles incoming requests like signup and login.
// it basically calls the functions declared in auth.service.js
const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signupUser(req.body);

  res.status(201).json({
    success: true,
    message: "User signed up successfully",
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: authService.sanitizeUser(req.user),
    },
  });
});

module.exports = {
  signup,
  login,
  getCurrentUser,
};
