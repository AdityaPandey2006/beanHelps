// defines the model for a support group
const mongoose = require("mongoose");

const supportGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    tags: {
      type: [String],
      required: true,
      default: [],
    },
    //this is the amount of members after which the group will be declared full
    capacity: {
      type: Number,
      min: 6,
      max: 10,
      default: 8,
    },
    //if the number of group members, due to leaving, falls below this number, the group will be declared with tag needs_members
    minimumStartSize: {
      type: Number,
      min: 2,
      max: 10,
      default: 6,
    },
    currentMemberCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupType: {
      type: String,
      enum: ["peer_led", "therapist_led"],
      default: "peer_led",
    },
    language: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["needs_members", "open", "full", "closed"],
      default: "needs_members",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

supportGroupSchema.index({ tags: 1, status: 1, isActive: 1 });
supportGroupSchema.index({ organizer: 1 });
supportGroupSchema.index({ therapist: 1 });
supportGroupSchema.index({ createdBy: 1 });

const SupportGroup = mongoose.model("SupportGroup", supportGroupSchema);

module.exports = SupportGroup;

// capacity: 8
// minimumStartSize: 6
// currentMemberCount: 8
// Status should be full.

// capacity: 8
// minimumStartSize: 6
// currentMemberCount: 6
// Status should be open.

// capacity: 8
// minimumStartSize: 6
// currentMemberCount: 5
// Status should be needs_members.

