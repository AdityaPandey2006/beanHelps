const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const { therapistProfileValidation } = require("./therapists.validation");
const {
  getTherapistProfile,
  updateTherapistProfile,
  getTherapistDashboard,
} = require("./therapists.controller");

const router = express.Router();

router.get("/profile", auth, authorizeRoles("beanpist"), getTherapistProfile);
router.get("/dashboard", auth, authorizeRoles("beanpist"), getTherapistDashboard);

router.patch(
  "/profile",
  auth,
  authorizeRoles("beanpist"),
  validateRequest(therapistProfileValidation),
  updateTherapistProfile
);

module.exports = router;
