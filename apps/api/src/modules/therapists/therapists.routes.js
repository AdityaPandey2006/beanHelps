const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const {
  therapistProfileValidation,
  updateTherapistVerificationValidation,
} = require("./therapists.validation");
const {
  updateTherapistProfile,
  getPendingTherapists,
  updateTherapistVerification,
  getTherapistDashboard,
} = require("./therapists.controller");

const router = express.Router();

router.get(
  "/dashboard",
  auth,
  authorizeRoles("beanpist"),
  getTherapistDashboard
);

router.patch(
  "/profile",
  auth,
  authorizeRoles("beanpist"),
  validateRequest(therapistProfileValidation),
  updateTherapistProfile
);

router.get(
  "/pending",
  auth,
  authorizeRoles("admin"),
  getPendingTherapists
);

router.patch(
  "/:therapistId/verification",
  auth,
  authorizeRoles("admin"),
  validateRequest(updateTherapistVerificationValidation),
  updateTherapistVerification
);

module.exports = router;