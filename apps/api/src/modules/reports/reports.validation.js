const createReportValidation = {
  targetType: {
    required: true,
    type: "string",
    enum: ["forum_post", "forum_comment", "support_group_message", "support_group"],
  },
  targetId: {
    required: true,
    type: "string",
  },
  reason: {
    required: true,
    type: "string",
    enum: [
      "harassment",
      "self_harm",
      "hate_speech",
      "spam",
      "misinformation",
      "unsafe_advice",
      "other",
    ],
  },
  details: {
    type: "string",
    maxLength: 1000,
  },
};

const updateReportStatusValidation = {
  status: {
    required: true,
    type: "string",
    enum: ["open", "reviewing", "resolved", "dismissed"],
  },
  resolutionNote: {
    type: "string",
    maxLength: 1000,
  },
};

const applyReportActionValidation = {
  action: {
    required: true,
    type: "string",
    enum: ["mark_reviewing", "dismiss", "resolve", "hide_content"],
  },
  resolutionNote: {
    type: "string",
    maxLength: 1000,
  },
};

module.exports = {
  createReportValidation,
  updateReportStatusValidation,
  applyReportActionValidation,
};