const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const { therapistProfileValidation } = require("./therapists.validation");
const { updateTherapistProfile } = require("./therapists.controller");

const router = express.Router();

router.patch(
  "/profile",
  auth,
  authorizeRoles("beanpist"),
  validateRequest(therapistProfileValidation),
  updateTherapistProfile
);

module.exports = router;
