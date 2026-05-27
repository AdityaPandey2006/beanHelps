const mongoose = require("mongoose");

const supportGroupWaitlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      required: true,
      default: [],
    },
    language: {
      type: String,
      trim: true,
      default: "",
    },
    preferredGroupType: {
      type: String,
      enum: ["peer_led", "therapist_led", "any"],
      default: "any",
    },
    status: {
      type: String,
      enum: ["waiting", "matched", "cancelled"],
      default: "waiting",
    },
    matchedSupportGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportGroup",
      default: null,
    },
    matchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportGroupWaitlistSchema.index({ user: 1, status: 1 });
supportGroupWaitlistSchema.index({ tags: 1, status: 1, createdAt: 1 });
supportGroupWaitlistSchema.index({ language: 1, status: 1 });

const SupportGroupWaitlist = mongoose.model(
  "SupportGroupWaitlist",
  supportGroupWaitlistSchema
);

module.exports = SupportGroupWaitlist;