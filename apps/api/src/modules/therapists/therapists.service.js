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

  const currentVerificationStatus =
    user.therapistProfile?.verificationStatus || "pending";

  if (currentVerificationStatus !== "pending") {
    throw new ApiError(
      403,
      "Therapist profile can only be updated while verification is pending"
    );
  }

  user.therapistProfile = {
    ...user.therapistProfile?.toObject?.(),
    specializations: payload.specializations,
    languages: payload.languages,
    experience: payload.experience,
    availability: payload.availability,
    licenseOrCertificateUrl: payload.licenseOrCertificateUrl,
    verificationStatus: "pending",
  };

  await user.save();

  return sanitizeUser(user);
};

const getPendingTherapists = async () => {
  return User.find({
    role: "beanpist",
    "therapistProfile.verificationStatus": "pending",
  }).select("-password");
};

const updateTherapistVerification = async (therapistId, payload) => {
  const therapist = await User.findOne({
    _id: therapistId,
    role: "beanpist",
  });

  if (!therapist) {
    throw new ApiError(404, "Therapist not found");
  }

  if (!therapist.therapistProfile) {
    throw new ApiError(400, "Therapist profile has not been completed");
  }

  therapist.therapistProfile.verificationStatus = payload.verificationStatus;

  await therapist.save();

  return sanitizeUser(therapist);
};

module.exports = {
  updateTherapistProfile,
  getPendingTherapists,
  updateTherapistVerification,
};
