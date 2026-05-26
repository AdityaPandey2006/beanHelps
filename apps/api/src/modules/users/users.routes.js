const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const { onboardingValidation } = require("./users.validation");
const { updateOnboarding } = require("./users.controller");

const router = express.Router();

router.patch(
  "/onboarding",
  auth,
  authorizeRoles("beaner"),
  validateRequest(onboardingValidation),
  updateOnboarding
);

module.exports = router;
