const mongoose = require("mongoose");

const ApiError = require("../../utils/apiError");
const Report = require("../../../models/Report");
const ForumPost = require("../../../models/ForumPost");
const ForumComment = require("../../../models/ForumComment");
const SupportGroup = require("../../../models/SupportGroup");
const SupportGroupMessage = require("../../../models/SupportGroupMessage");

const targetModels = {
  forum_post: ForumPost,
  forum_comment: ForumComment,
  support_group_message: SupportGroupMessage,
  support_group: SupportGroup,
};

const ensureValidTarget = async (targetType, targetId) => {
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, "Invalid report target id");
  }

  const Model = targetModels[targetType];

  if (!Model) {
    throw new ApiError(400, "Invalid report target type");
  }

  const target = await Model.findById(targetId);

  if (!target) {
    throw new ApiError(404, "Report target not found");
  }

  return target;
};

const createReport = async (reporter, payload) => {
  await ensureValidTarget(payload.targetType, payload.targetId);

  const report = await Report.create({
    reporter: reporter._id,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    details: payload.details || "",
  });

  return Report.findById(report._id).populate("reporter", "name role email");
};

const getReports = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.targetType) {
    query.targetType = filters.targetType;
  }

  return Report.find(query)
    .populate("reporter", "name role email")
    .populate("reviewedBy", "name role email")
    .sort({ createdAt: -1 });
};

const updateReportStatus = async (reportId, reviewer, payload) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id");
  }

  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  report.status = payload.status;
  report.reviewedBy = reviewer._id;
  report.reviewedAt = new Date();

  if (payload.resolutionNote !== undefined) {
    report.resolutionNote = payload.resolutionNote;
  }

  await report.save();

  return Report.findById(report._id)
    .populate("reporter", "name role email")
    .populate("reviewedBy", "name role email");
};

const getReportById = async (reportId) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id");
  }

  const report = await Report.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  return report;
};

const hideReportedTarget = async (report) => {
  const Model = targetModels[report.targetType];

  if (!Model) {
    throw new ApiError(400, "Invalid report target type");
  }

  const target = await Model.findById(report.targetId);

  if (!target) {
    throw new ApiError(404, "Report target not found");
  }

  if (report.targetType === "support_group") {
    target.isActive = false;
    target.status = "closed";
  } else {
    target.isDeleted = true;
  }

  await target.save();
};

const applyReportAction = async (reportId, reviewer, payload) => {
  const report = await getReportById(reportId);

  if (payload.action === "mark_reviewing") {
    report.status = "reviewing";
  }

  if (payload.action === "dismiss") {
    report.status = "dismissed";
  }

  if (payload.action === "resolve") {
    report.status = "resolved";
  }

  if (payload.action === "hide_content") {
    await hideReportedTarget(report);
    report.status = "resolved";
  }

  report.reviewedBy = reviewer._id;
  report.reviewedAt = new Date();

  if (payload.resolutionNote !== undefined) {
    report.resolutionNote = payload.resolutionNote;
  }

  await report.save();

  return Report.findById(report._id)
    .populate("reporter", "name role email")
    .populate("reviewedBy", "name role email");
};

module.exports = {
  createReport,
  getReports,
  updateReportStatus,
  applyReportAction,
};