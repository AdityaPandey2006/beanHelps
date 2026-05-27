const matchSupportGroupValidation = {
  tags: {
    required: true,
    type: "array",
    itemType: "string",
  },
  language: {
    type: "string",
    maxLength: 50,
  },
  preferredGroupType: {
    type: "string",
    enum: ["peer_led", "therapist_led", "any"],
  },
};

const createSupportGroupValidation = {
  name: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 80,
  },
  description: {
    type: "string",
    maxLength: 500,
  },
  tags: {
    required: true,
    type: "array",
    itemType: "string",
  },
  // default capacity is 8 so any auto-created 
  // group has capacity 8 and any therepist has therapist-set group
  capacity: {
    type: "number",
  },
  minimumStartSize: {
    type: "number",
  },
  groupType: {
    type: "string",
    enum: ["peer_led", "therapist_led"],
  },
  language: {
    type: "string",
    maxLength: 50,
  },
};

const createSupportGroupMeetingValidation = {
  title: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 120,
  },
  description: {
    type: "string",
    maxLength: 1000,
  },
  mode: {
    required: true,
    type: "string",
    enum: ["online", "offline", "hybrid"],
  },
  startsAt: {
    required: true,
    type: "string",
  },
  endsAt: {
    required: true,
    type: "string",
  },
  meetingLink: {
    type: "string",
    maxLength: 500,
  },
  location: {
    type: "string",
    maxLength: 300,
  },
  isRecurring: {
    type: "boolean",
  },
  recurrenceRule: {
    type: "string",
    maxLength: 200,
  },
};

const createSupportGroupMessageValidation = {
  content: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 2000,
  },
  messageType: {
    type: "string",
    enum: ["text", "prompt", "resource"],
  },
};

module.exports = {
  matchSupportGroupValidation,
  createSupportGroupValidation,
  createSupportGroupMeetingValidation,
  createSupportGroupMessageValidation,
};