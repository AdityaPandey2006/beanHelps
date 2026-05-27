const asyncHandler = require("../../utils/asyncHandler");
const forumsService = require("./forums.service");

const getForums = asyncHandler(async (req, res) => {
  const forums = await forumsService.getAllForums();

  res.status(200).json({
    success: true,
    message: "Forums fetched successfully",
    data: {
      forums,
    },
  });
});

const getForum = asyncHandler(async (req, res) => {
  const forum = await forumsService.getForumById(req.params.forumId);

  res.status(200).json({
    success: true,
    message: "Forum fetched successfully",
    data: {
      forum,
    },
  });
});

const getForumBySlug = asyncHandler(async (req, res) => {
  const forum = await forumsService.getForumBySlug(req.params.slug);

  res.status(200).json({
    success: true,
    message: "Forum fetched successfully",
    data: {
      forum,
    },
  });
});

const createPost = asyncHandler(async (req, res) => {
  const post = await forumsService.createForumPost(req.params.forumId, req.user, req.body);

  res.status(201).json({
    success: true,
    message: "Forum post created successfully",
    data: {
      post,
    },
  });
});

const getPosts = asyncHandler(async (req, res) => {
  const posts = await forumsService.getForumPosts(req.params.forumId);

  res.status(200).json({
    success: true,
    message: "Forum posts fetched successfully",
    data: {
      posts,
    },
  });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await forumsService.createForumComment(req.params.postId, req.user, req.body);

  res.status(201).json({
    success: true,
    message: "Forum comment created successfully",
    data: {
      comment,
    },
  });
});

const getComments = asyncHandler(async (req, res) => {
  const comments = await forumsService.getForumPostComments(req.params.postId);

  res.status(200).json({
    success: true,
    message: "Forum comments fetched successfully",
    data: {
      comments,
    },
  });
});

const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await forumsService.createForumMeeting(req.params.forumId, req.user, req.body);

  res.status(201).json({
    success: true,
    message: "Forum meeting created successfully",
    data: {
      meeting,
    },
  });
});

const getMeetings = asyncHandler(async (req, res) => {
  const meetings = await forumsService.getForumMeetings(req.params.forumId);

  res.status(200).json({
    success: true,
    message: "Forum meetings fetched successfully",
    data: {
      meetings,
    },
  });
});

module.exports = {
  getForums,
  getForum,
  getForumBySlug,
  createPost,
  getPosts,
  createComment,
  getComments,
  createMeeting,
  getMeetings,
};