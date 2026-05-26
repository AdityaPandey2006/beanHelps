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

const sanitizeUser = (user) => {
  const sanitizedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.role === "beanpist" && user.therapistProfile) {
    sanitizedUser.therapistProfile = {
      verificationStatus: user.therapistProfile.verificationStatus,
      specializations: user.therapistProfile.specializations,
      languages: user.therapistProfile.languages,
      experience: user.therapistProfile.experience,
      availability: user.therapistProfile.availability,
      licenseOrCertificateUrl: user.therapistProfile.licenseOrCertificateUrl,
    };
  }

  if (user.onboardingProfile) {
    sanitizedUser.onboardingProfile = {
      ageRange: user.onboardingProfile.ageRange,
      languages: user.onboardingProfile.languages,
      location: user.onboardingProfile.location,
      preferredGroupSize: user.onboardingProfile.preferredGroupSize,
      primaryStruggles: user.onboardingProfile.primaryStruggles,
      optionalTags: user.onboardingProfile.optionalTags,
      description: user.onboardingProfile.description,
      completedAt: user.onboardingProfile.completedAt,
    };
  }

  return sanitizedUser;
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
  sanitizeUser,
  signupUser,
  loginUser,
};
