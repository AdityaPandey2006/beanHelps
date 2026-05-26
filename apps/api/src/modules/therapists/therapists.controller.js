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

module.exports = {
  updateTherapistProfile,
};
