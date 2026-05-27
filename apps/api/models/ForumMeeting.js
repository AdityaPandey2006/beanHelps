const mongoose = require("mongoose");

const forumMeetingSchema = new mongoose.Schema(
  {
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },
    host: {
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
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    meetingType: {
      type: String,
      enum: ["webinar", "open_discussion", "workshop", "qna"],
      default: "webinar",
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online",
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
    capacity: {
      type: Number,
      min: 1,
      default: 100,
    },
    tags: {
      type: [String],
      default: [],
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

const ForumMeeting = mongoose.model("ForumMeeting", forumMeetingSchema);

module.exports = ForumMeeting;