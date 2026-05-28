const asyncHandler = require("../../utils/asyncHandler");
const reportsService = require("./reports.service");

const createReport = asyncHandler(async (req, res) => {
  const report = await reportsService.createReport(req.user, req.body);

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    data: {
      report,
    },
  });
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await reportsService.getReports({
    status: req.query.status,
    targetType: req.query.targetType,
  });

  res.status(200).json({
    success: true,
    message: "Reports fetched successfully",
    data: {
      reports,
    },
  });
});

const updateReportStatus = asyncHandler(async (req, res) => {
  const report = await reportsService.updateReportStatus(
    req.params.reportId,
    req.user,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Report status updated successfully",
    data: {
      report,
    },
  });
});

const applyReportAction = asyncHandler(async (req, res) => {
  const report = await reportsService.applyReportAction(
    req.params.reportId,
    req.user,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Report action applied successfully",
    data: {
      report,
    },
  });
});

module.exports = {
  createReport,
  getReports,
  updateReportStatus,
  applyReportAction,
};