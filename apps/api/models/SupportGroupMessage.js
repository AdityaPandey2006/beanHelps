const mongoose = require("mongoose");

const supportGroupMessageSchema = new mongoose.Schema(
  {
    supportGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportGroup",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "prompt", "resource"],
      default: "text",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

supportGroupMessageSchema.index({ supportGroup: 1, createdAt: -1 });
supportGroupMessageSchema.index({ sender: 1 });

const SupportGroupMessage = mongoose.model(
  "SupportGroupMessage",
  supportGroupMessageSchema
);

module.exports = SupportGroupMessage;