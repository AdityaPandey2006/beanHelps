const asyncHandler = require("../../utils/asyncHandler");
const usersService = require("./users.service");

const updateOnboarding = asyncHandler(async (req, res) => {
  const user = await usersService.updateOnboarding(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "User onboarding updated successfully",
    data: {
      user,
    },
  });
});

module.exports = {
  updateOnboarding,
};
