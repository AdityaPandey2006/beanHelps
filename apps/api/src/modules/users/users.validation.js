const onboardingValidation = {
  ageRange: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 50,
  },
  languages: {
    required: true,
    type: "array",
    itemType: "string",
  },
  location: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  preferredGroupSize: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 30,
  },
  primaryStruggles: {
    required: true,
    type: "array",
    itemType: "string",
  },
  optionalTags: {
    type: "array",
    itemType: "string",
  },
  description: {
    type: "string",
    maxLength: 500,
  },
};

const profileValidation = {
  displayName: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 40,
  },
};

module.exports = {
  onboardingValidation,
  profileValidation,
};
