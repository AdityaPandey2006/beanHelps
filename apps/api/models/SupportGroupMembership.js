const mongoose = require("mongoose");

const supportGroupMembershipSchema = new mongoose.Schema(
  {
    supportGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportGroup",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "organizer", "therapist"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "left", "removed"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportGroupMembershipSchema.index(
  { supportGroup: 1, user: 1 },
  { unique: true }
);

supportGroupMembershipSchema.index({ supportGroup: 1, status: 1 });
supportGroupMembershipSchema.index({ user: 1, status: 1 });
supportGroupMembershipSchema.index({ supportGroup: 1, joinedAt: 1 });

const SupportGroupMembership = mongoose.model(
  "SupportGroupMembership",
  supportGroupMembershipSchema
);

module.exports = SupportGroupMembership;