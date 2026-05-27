const mongoose = require("mongoose");

const supportGroupMeetingSchema = new mongoose.Schema(
  {
    supportGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportGroup",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

supportGroupMeetingSchema.index({ supportGroup: 1, startsAt: 1 });
supportGroupMeetingSchema.index({ organizer: 1 });
supportGroupMeetingSchema.index({ status: 1 });

const SupportGroupMeeting = mongoose.model(
  "SupportGroupMeeting",
  supportGroupMeetingSchema
);

module.exports = SupportGroupMeeting;