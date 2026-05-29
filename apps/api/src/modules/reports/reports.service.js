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

const HIGH_PRIORITY_REPORT_THRESHOLD = 3;
const AUTO_HIDE_REPORT_THRESHOLD = 5;
const AUTO_HIDE_REASONS = new Set([
  "harassment",
  "hate_speech",
  "self_harm",
  "spam",
  "unsafe_advice",
]);

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

  const existingReport = await Report.findOne({
    reporter: reporter._id,
    targetType: payload.targetType,
    targetId: payload.targetId,
  });

  if (existingReport) {
    throw new ApiError(409, "You have already reported this content");
  }

  let report;

  try {
    report = await Report.create({
      reporter: reporter._id,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      details: payload.details || "",
      priority: payload.reason === "self_harm" ? "high" : "normal",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "You have already reported this content");
    }

    throw error;
  }

  await refreshTargetReportPriority(payload.targetType, payload.targetId);

  return Report.findById(report._id).populate("reporter", "name role email");
};

const getReasonBreakdown = (reports) => {
  return reports.reduce((breakdown, report) => {
    breakdown[report.reason] = (breakdown[report.reason] || 0) + 1;
    return breakdown;
  }, {});
};

const shouldBeHighPriority = (reports) => {
  return (
    reports.length >= HIGH_PRIORITY_REPORT_THRESHOLD ||
    reports.some((report) => report.reason === "self_harm")
  );
};

const shouldAutoHide = (reports) => {
  return (
    reports.length >= AUTO_HIDE_REPORT_THRESHOLD &&
    reports.some((report) => AUTO_HIDE_REASONS.has(report.reason))
  );
};

const refreshTargetReportPriority = async (targetType, targetId) => {
  const reports = await Report.find({ targetType, targetId }).sort({ createdAt: -1 });
  const priority = shouldBeHighPriority(reports) ? "high" : "normal";
  const autoHideNeeded = shouldAutoHide(reports);

  await Report.updateMany(
    { targetType, targetId },
    {
      priority,
      ...(autoHideNeeded ? { status: "reviewing" } : {}),
    }
  );

  if (autoHideNeeded && !reports.some((report) => report.autoHiddenAt)) {
    await hideReportedTarget({ targetType, targetId });
    await Report.updateMany(
      { targetType, targetId },
      {
        priority: "high",
        status: "reviewing",
        autoHiddenAt: new Date(),
        resolutionNote:
          "Automatically hidden after repeated serious reports. Awaiting admin review.",
      }
    );
  }
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

const getReportSummaries = async (filters = {}) => {
  const reports = await getReports(filters);
  const summariesByTarget = new Map();

  reports.forEach((report) => {
    const key = `${report.targetType}:${report.targetId.toString()}`;
    const current = summariesByTarget.get(key) || {
      targetType: report.targetType,
      targetId: report.targetId,
      reportCount: 0,
      reasonBreakdown: {},
      priority: "normal",
      status: "open",
      autoHidden: false,
      latestReport: null,
      reports: [],
    };

    current.reportCount += 1;
    current.reports.push(report);
    current.reasonBreakdown[report.reason] =
      (current.reasonBreakdown[report.reason] || 0) + 1;

    if (report.priority === "high") {
      current.priority = "high";
    }

    if (report.autoHiddenAt) {
      current.autoHidden = true;
    }

    if (!current.latestReport || report.createdAt > current.latestReport.createdAt) {
      current.latestReport = report;
    }

    summariesByTarget.set(key, current);
  });

  return [...summariesByTarget.values()]
    .map((summary) => ({
      ...summary,
      reasonBreakdown: getReasonBreakdown(summary.reports),
      status: getGroupedStatus(summary.reports),
      representativeReportId: summary.latestReport._id,
      latestDetails: summary.latestReport.details,
      latestReason: summary.latestReport.reason,
      latestCreatedAt: summary.latestReport.createdAt,
      latestReporter: summary.latestReport.reporter,
      reports: summary.reports.map((report) => ({
        id: report._id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        priority: report.priority,
        reporter: report.reporter,
        createdAt: report.createdAt,
      })),
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === "high" ? -1 : 1;
      }
      if (b.reportCount !== a.reportCount) {
        return b.reportCount - a.reportCount;
      }
      return new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt);
    });
};

const getGroupedStatus = (reports) => {
  if (reports.some((report) => report.status === "reviewing")) {
    return "reviewing";
  }

  if (reports.some((report) => report.status === "open")) {
    return "open";
  }

  if (reports.every((report) => report.status === "dismissed")) {
    return "dismissed";
  }

  return "resolved";
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

  if (["dismiss", "resolve", "hide_content"].includes(payload.action)) {
    await Report.updateMany(
      {
        targetType: report.targetType,
        targetId: report.targetId,
      },
      {
        status: report.status,
        reviewedBy: reviewer._id,
        reviewedAt: report.reviewedAt,
        resolutionNote: report.resolutionNote,
      }
    );
  }

  return Report.findById(report._id)
    .populate("reporter", "name role email")
    .populate("reviewedBy", "name role email");
};

module.exports = {
  createReport,
  getReports,
  getReportSummaries,
  updateReportStatus,
  applyReportAction,
};
