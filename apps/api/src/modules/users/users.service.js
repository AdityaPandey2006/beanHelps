const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");
const { sanitizeUser } = require("../auth/auth.service");

const updateOnboarding = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.onboardingProfile = {
    ageRange: payload.ageRange,
    languages: payload.languages,
    location: payload.location,
    preferredGroupSize: payload.preferredGroupSize,
    primaryStruggles: payload.primaryStruggles,
    optionalTags: payload.optionalTags || [],
    description: payload.description || "",
    completedAt: new Date(),
  };

  await user.save();

  return sanitizeUser(user);
};

module.exports = {
  updateOnboarding,
};
