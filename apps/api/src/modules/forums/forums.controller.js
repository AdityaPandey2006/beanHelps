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

const joinMeeting = asyncHandler(async (req, res) => {
  const registration = await forumsService.joinForumMeeting(
    req.params.meetingId,
    req.user
  );

  res.status(200).json({
    success: true,
    message: "Joined forum meeting successfully",
    data: {
      registration,
    },
  });
});

const leaveMeeting = asyncHandler(async (req, res) => {
  const registration = await forumsService.leaveForumMeeting(
    req.params.meetingId,
    req.user
  );

  res.status(200).json({
    success: true,
    message: "Left forum meeting successfully",
    data: {
      registration,
    },
  });
});

const getMyMeetingRegistrations = asyncHandler(async (req, res) => {
  const registrations = await forumsService.getMyForumMeetingRegistrations(req.user);

  res.status(200).json({
    success: true,
    message: "My forum meeting registrations fetched successfully",
    data: {
      registrations,
    },
  });
});

const getMyForums = asyncHandler(async (req, res) => {
  const forums = await forumsService.getMyForums(req.user);

  res.status(200).json({
    success: true,
    message: "My forums fetched successfully",
    data: {
      forums,
    },
  });
});

const getExploreForums = asyncHandler(async (req, res) => {
  const forums = await forumsService.getExploreForums(req.user);

  res.status(200).json({
    success: true,
    message: "Explore forums fetched successfully",
    data: {
      forums,
    },
  });
});

const getRecommendedForums = asyncHandler(async (req, res) => {
  const forums = await forumsService.getRecommendedForums(req.user);

  res.status(200).json({
    success: true,
    message: "Recommended forums fetched successfully",
    data: {
      forums,
    },
  });
});

const joinForum = asyncHandler(async (req, res) => {
  const membership = await forumsService.joinForum(req.params.forumId, req.user);

  res.status(200).json({
    success: true,
    message: "Joined forum successfully",
    data: {
      membership,
    },
  });
});

const leaveForum = asyncHandler(async (req, res) => {
  const membership = await forumsService.leaveForum(req.params.forumId, req.user);

  res.status(200).json({
    success: true,
    message: "Left forum successfully",
    data: {
      membership,
    },
  });
});

const joinRecommendedForums = asyncHandler(async (req, res) => {
  const memberships = await forumsService.joinRecommendedForums(req.user);

  res.status(200).json({
    success: true,
    message: "Joined recommended forums successfully",
    data: {
      memberships,
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
  joinMeeting,
  leaveMeeting,
  getMyMeetingRegistrations,
  getMyForums,
  getExploreForums,
  getRecommendedForums,
  joinForum,
  leaveForum,
  joinRecommendedForums,
};
