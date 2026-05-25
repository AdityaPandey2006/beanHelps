// auth.service.js
// Contains the real auth logic like creating users, 
// checking passwords, generating tokens.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");

const createToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

//sanitizeUser removes the user's sensitive data before 
//sending it to the frontend
const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const signupUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
  });

  const token = createToken(user._id);
  //the mongodb id(unique) of the user is used to create his/her token

  return {
    user: sanitizeUser(user),
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = createToken(user._id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

module.exports = {
  signupUser,
  loginUser,
};