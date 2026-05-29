const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const { onboardingValidation, profileValidation } = require("./users.validation");
const { updateProfile, updateOnboarding, getBeanerHome } = require("./users.controller");

const router = express.Router();

router.get(
  "/home",
  auth,
  authorizeRoles("beaner"),
  getBeanerHome
);

router.patch(
  "/me",
  auth,
  validateRequest(profileValidation),
  updateProfile
);

router.patch(
  "/onboarding",
  auth,
  authorizeRoles("beaner"),
  validateRequest(onboardingValidation),
  updateOnboarding
);

module.exports = router;
