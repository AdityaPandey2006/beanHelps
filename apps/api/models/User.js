//this will be storing the User model. 
//Basically, the format in which the user will be stored in the database
const mongoose = require("mongoose");

const therapistProfileSchema = new mongoose.Schema(
  {
    specializations: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    availability: {
      type: String,
      trim: true,
      default: "",
    },
    licenseOrCertificateUrl: {
      type: String,
      trim: true,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ["not_applicable", "pending", "verified", "rejected"],
      default: "not_applicable",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["beaner", "beanpist", "admin"],
      default: "beaner",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    therapistProfile: {
      type: therapistProfileSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function setTherapistProfile() {
  if (this.role === "beanpist" && !this.therapistProfile) {
    this.therapistProfile = {
      verificationStatus: "pending",
    };
  }

  if (this.role !== "beanpist") {
    this.therapistProfile = undefined;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;