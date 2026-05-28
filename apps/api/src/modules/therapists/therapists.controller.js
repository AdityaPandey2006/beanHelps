const asyncHandler = require("../../utils/asyncHandler");
const therapistsService = require("./therapists.service");

const updateTherapistProfile = asyncHandler(async (req, res) => {
  const user = await therapistsService.updateTherapistProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Therapist profile updated successfully",
    data: {
      user,
    },
  });
});

const getPendingTherapists = asyncHandler(async (req, res) => {
  const therapists = await therapistsService.getPendingTherapists();

  res.status(200).json({
    success: true,
    message: "Pending therapists fetched successfully",
    data: {
      therapists,
    },
  });
});

const updateTherapistVerification = asyncHandler(async (req, res) => {
  const therapist = await therapistsService.updateTherapistVerification(
    req.params.therapistId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Therapist verification updated successfully",
    data: {
      therapist,
    },
  });
});

module.exports = {
  updateTherapistProfile,
  getPendingTherapists,
  updateTherapistVerification,
};
