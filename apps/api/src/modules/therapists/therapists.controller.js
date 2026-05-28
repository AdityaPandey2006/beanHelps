const asyncHandler = require("../../utils/asyncHandler");
const therapistsService = require("./therapists.service");

const getTherapistProfile = asyncHandler(async (req, res) => {
  const user = await therapistsService.getTherapistProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: "Therapist profile fetched successfully",
    data: {
      user,
    },
  });
});

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

const getTherapistDashboard = asyncHandler(async (req, res) => {
  const dashboard = await therapistsService.getTherapistDashboard(req.user);

  res.status(200).json({
    success: true,
    message: "Therapist dashboard fetched successfully",
    data: {
      dashboard,
    },
  });
});

module.exports = {
  getTherapistProfile,
  updateTherapistProfile,
  getTherapistDashboard,
};
