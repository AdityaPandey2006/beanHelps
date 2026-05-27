const ApiError = require("../../utils/apiError");
const Forum = require("../../../models/Forum");

const ForumPost = require("../../../models/ForumPost");
const ForumComment = require("../../../models/ForumComment");

const ForumMeeting = require("../../../models/ForumMeeting");

const getAllForums = async () => {
  return Forum.find({ isActive: true }).sort({ name: 1 });
};

const getForumById = async (forumId) => {
  const forum = await Forum.findOne({
    _id: forumId,
    isActive: true,
  });

  if (!forum) {
    throw new ApiError(404, "Forum not found");
  }

  return forum;
};

const getForumBySlug = async (slug) => {
  const forum = await Forum.findOne({
    slug: slug.toLowerCase(),
    isActive: true,
  });

  if (!forum) {
    throw new ApiError(404, "Forum not found");
  }

  return forum;
};

const createForumPost = async (forumId, author, payload) => {
  const forum = await getForumById(forumId);

  if (
    ["therapist_article", "resource"].includes(payload.type) &&
    !["beanpist", "admin"].includes(author.role)
  ) {
    throw new ApiError(403, "Only therapists can create therapist articles or resources");
  }

  const post = await ForumPost.create({
    forum: forum._id,
    author: author._id,
    title: payload.title,
    content: payload.content,
    type: payload.type || "thread",
    tags: payload.tags || [],
  });

  return ForumPost.findById(post._id)
    .populate("author", "name role")
    .populate("forum", "name slug");
};

const getForumPosts = async (forumId) => {
  await getForumById(forumId);

  return ForumPost.find({ forum: forumId })
    .populate("author", "name role")
    .populate("forum", "name slug")
    .sort({ isPinned: -1, createdAt: -1 });
};

const getForumPostById = async (postId) => {
  const post = await ForumPost.findById(postId);

  if (!post) {
    throw new ApiError(404, "Forum post not found");
  }

  return post;
};

const createForumComment = async (postId, author, payload) => {
  const post = await getForumPostById(postId);

  if (post.isLocked) {
    throw new ApiError(403, "This post is locked");
  }

  if (payload.parentComment) {
    const parentComment = await ForumComment.findOne({
      _id: payload.parentComment,
      post: post._id,
      isDeleted: false,
    });

    if (!parentComment) {
      throw new ApiError(404, "Parent comment not found");
    }
  }

  const comment = await ForumComment.create({
    post: post._id,
    forum: post.forum,
    author: author._id,
    content: payload.content,
    parentComment: payload.parentComment || null,
  });

  return ForumComment.findById(comment._id)
    .populate("author", "name role")
    .populate("post", "title")
    .populate("forum", "name slug");
};

const getForumPostComments = async (postId) => {
  await getForumPostById(postId);

  return ForumComment.find({
    post: postId,
    isDeleted: false,
  })
    .populate("author", "name role")
    .sort({ createdAt: 1 });
};

const createForumMeeting = async (forumId, host, payload) => {
  const forum = await getForumById(forumId);

  if (!["beanpist", "admin"].includes(host.role)) {
    throw new ApiError(403, "Only therapists can create forum meetings");
  }

  const startsAt = new Date(payload.startsAt);
  const endsAt = new Date(payload.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new ApiError(400, "Meeting start and end times must be valid dates");
  }

  if (endsAt <= startsAt) {
    throw new ApiError(400, "Meeting end time must be after start time");
  }

  if (payload.mode === "online" && !payload.meetingLink) {
    throw new ApiError(400, "Online meetings require a meeting link");
  }

  if (payload.mode === "offline" && !payload.location) {
    throw new ApiError(400, "Offline meetings require a location");
  }

  const meeting = await ForumMeeting.create({
    forum: forum._id,
    host: host._id,
    title: payload.title,
    description: payload.description,
    meetingType: payload.meetingType || "webinar",
    mode: payload.mode,
    startsAt,
    endsAt,
    meetingLink: payload.meetingLink || "",
    location: payload.location || "",
    capacity: payload.capacity || 100,
    tags: payload.tags || [],
  });

  return ForumMeeting.findById(meeting._id)
    .populate("host", "name role")
    .populate("forum", "name slug");
};

const getForumMeetings = async (forumId) => {
  await getForumById(forumId);

  return ForumMeeting.find({
    forum: forumId,
    status: "scheduled",
  })
    .populate("host", "name role")
    .populate("forum", "name slug")
    .sort({ startsAt: 1 });
};

module.exports = {
  getAllForums,
  getForumById,
  getForumBySlug,
  createForumPost,
  getForumPosts,
  createForumComment,
  getForumPostComments,
  createForumMeeting,
  getForumMeetings,
};