const express = require("express");

const auth = require("../../middleware/auth");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const {
  createReport,
  getReports,
  updateReportStatus,
  applyReportAction,
} = require("./reports.controller");
const {
  createReportValidation,
  updateReportStatusValidation,
  applyReportActionValidation,
} = require("./reports.validation");

const router = express.Router();

router.post("/", auth, validateRequest(createReportValidation), createReport);

router.get("/", auth, authorizeRoles("admin"), getReports);

router.patch(
  "/:reportId/status",
  auth,
  authorizeRoles("admin"),
  validateRequest(updateReportStatusValidation),
  updateReportStatus
);

router.patch(
  "/:reportId/action",
  auth,
  authorizeRoles("admin"),
  validateRequest(applyReportActionValidation),
  applyReportAction
);

module.exports = router;