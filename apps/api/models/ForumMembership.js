const mongoose = require("mongoose");

const forumMembershipSchema = new mongoose.Schema(
  {
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["member", "therapist", "moderator"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "left"],
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

forumMembershipSchema.index(
  { forum: 1, user: 1 },
  { unique: true }
);

forumMembershipSchema.index({ user: 1, status: 1 });
forumMembershipSchema.index({ forum: 1, status: 1 });

const ForumMembership = mongoose.model("ForumMembership", forumMembershipSchema);

module.exports = ForumMembership;