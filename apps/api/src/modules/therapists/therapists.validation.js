const therapistProfileValidation = {
  specializations: {
    required: true,
    type: "array",
    itemType: "string",
  },
  languages: {
    required: true,
    type: "array",
    itemType: "string",
  },
  experience: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 200,
  },
  availability: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 200,
  },
  licenseOrCertificateUrl: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 500,
  },
};

const updateTherapistVerificationValidation = {
  verificationStatus: {
    required: true,
    type: "string",
    enum: ["verified", "rejected", "pending"],
  },
};

module.exports = {
  therapistProfileValidation,
  updateTherapistVerificationValidation,
};
