//Forum.js stores the way Forums will be stored in the database
const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    //a slug is basically a unique nickname for a forum
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Forum = mongoose.model("Forum", forumSchema);

module.exports = Forum;