const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");
const { sanitizeUser } = require("../auth/auth.service");

const updateTherapistProfile = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "beanpist") {
    throw new ApiError(403, "Only therapists can update therapist profiles");
  }

  user.therapistProfile = {
    ...user.therapistProfile?.toObject?.(),
    specializations: payload.specializations,
    languages: payload.languages,
    experience: payload.experience,
    availability: payload.availability,
    licenseOrCertificateUrl: payload.licenseOrCertificateUrl,
    verificationStatus: user.therapistProfile?.verificationStatus || "pending",
  };

  await user.save();

  return sanitizeUser(user);
};

module.exports = {
  updateTherapistProfile,
};
