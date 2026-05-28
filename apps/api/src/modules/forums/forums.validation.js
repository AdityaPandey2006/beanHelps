const createForumValidation = {
  name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 50,
  },
  slug: {
    type: "string",
    minLength: 2,
    maxLength: 60,
  },
  description: {
    required: true,
    type: "string",
    minLength: 10,
    maxLength: 300,
  },
  icon: {
    type: "string",
    maxLength: 50,
  },
  tags: {
    type: "array",
    itemType: "string",
  },
};

const createPostValidation = {
  title: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 120,
  },
  content: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 5000,
  },
  type: {
    type: "string",
    enum: ["thread", "question", "therapist_article", "resource"],
  },
  tags: {
    type: "array",
    itemType: "string",
  },
};

const createCommentValidation = {
  content: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 2000,
  },
  parentComment: {
    type: "string",
  },
};

const createMeetingValidation = {
  title: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 120,
  },
  description: {
    required: true,
    type: "string",
    minLength: 10,
    maxLength: 1000,
  },
  meetingType: {
    type: "string",
    enum: ["webinar", "open_discussion", "workshop", "qna"],
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
  capacity: {
    type: "number",
  },
  tags: {
    type: "array",
    itemType: "string",
  },
};

module.exports = {
  createForumValidation,
  createPostValidation,
  createCommentValidation,
  createMeetingValidation,
};
