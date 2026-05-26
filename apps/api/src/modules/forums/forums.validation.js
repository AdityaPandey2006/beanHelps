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

module.exports = {
  createPostValidation,
  createCommentValidation,
};