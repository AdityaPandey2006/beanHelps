const mongoose = require("mongoose");

const forumMeetingRegistrationSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumMeeting",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

forumMeetingRegistrationSchema.index(
  { meeting: 1, user: 1 },
  { unique: true }
);
forumMeetingRegistrationSchema.index({ user: 1, status: 1 });
forumMeetingRegistrationSchema.index({ meeting: 1, status: 1 });

const ForumMeetingRegistration = mongoose.model(
  "ForumMeetingRegistration",
  forumMeetingRegistrationSchema
);

module.exports = ForumMeetingRegistration;
