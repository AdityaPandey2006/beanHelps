const ApiError = require("../../utils/apiError");
const Forum = require("../../../models/Forum");

const ForumPost = require("../../../models/ForumPost");
const ForumComment = require("../../../models/ForumComment");

const ForumMeeting = require("../../../models/ForumMeeting");

const ForumMembership = require("../../../models/ForumMembership");

const createSlug = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const normalizeTags = (tags = []) => {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
};

const getAllForums = async () => {
  return Forum.find({ isActive: true }).sort({ name: 1 });
};

const createForum = async (creator, payload) => {
  if (!["beanpist", "admin"].includes(creator.role)) {
    throw new ApiError(403, "Only therapists can create forums");
  }

  const slug = createSlug(payload.slug || payload.name);

  if (!slug) {
    throw new ApiError(400, "Forum slug could not be created from the name");
  }

  const existingForum = await Forum.findOne({ slug });

  if (existingForum) {
    throw new ApiError(409, "A forum with this name or slug already exists");
  }

  return Forum.create({
    name: payload.name,
    slug,
    description: payload.description,
    icon: payload.icon || "",
    tags: normalizeTags(payload.tags || []),
    isFeatured: false,
    createdBy: creator._id,
  });
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

const getMyForums = async (user) => {
  if (user.role === "beanpist") {
    return Forum.find({
      isActive: true,
      isFeatured: true,
    }).sort({ name: 1 });
  }

  const memberships = await ForumMembership.find({
    user: user._id,
    status: "active",
  })
    .populate("forum")
    .sort({ joinedAt: -1 });

  return memberships
    .map((membership) => membership.forum)
    .filter((forum) => forum?.isActive);
};

const getExploreForums = async (user) => {
  if (user.role === "beanpist") {
    return Forum.find({
      isActive: true,
      isFeatured: true,
    }).sort({ name: 1 });
  }

  const memberships = await ForumMembership.find({
    user: user._id,
    status: "active",
  }).select("forum");

  const joinedForumIds = memberships.map((membership) => membership.forum);

  return Forum.find({
    _id: { $nin: joinedForumIds },
    isActive: true,
  }).sort({ isFeatured: -1, name: 1 });
};

const getRecommendedForums = async (user) => {
  if (user.role === "beanpist") {
    return Forum.find({
      isActive: true,
      isFeatured: true,
    }).sort({ name: 1 });
  }

  const primaryStruggles = user.onboardingProfile?.primaryStruggles || [];

  if (!primaryStruggles.length) {
    return Forum.find({
      isActive: true,
      isFeatured: true,
    }).sort({ name: 1 });
  }

  const normalizedStruggles = primaryStruggles.map((struggle) =>
    struggle.trim().toLowerCase()
  );

  const memberships = await ForumMembership.find({
    user: user._id,
    status: "active",
  }).select("forum");

  const joinedForumIds = memberships.map((membership) => membership.forum);

  return Forum.find({
    _id: { $nin: joinedForumIds },
    isActive: true,
    tags: { $in: normalizedStruggles },
  }).sort({ isFeatured: -1, name: 1 });
};

const joinForum = async (forumId, user) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners need to manually join forums");
  }

  const forum = await getForumById(forumId);

  const existingMembership = await ForumMembership.findOne({
    forum: forum._id,
    user: user._id,
  });

  if (existingMembership?.status === "active") {
    throw new ApiError(409, "You are already part of this forum");
  }

  if (existingMembership) {
    existingMembership.status = "active";
    existingMembership.leftAt = null;
    existingMembership.joinedAt = new Date();
    await existingMembership.save();

    return existingMembership.populate("forum");
  }

  const membership = await ForumMembership.create({
    forum: forum._id,
    user: user._id,
    role: "member",
  });

  return membership.populate("forum");
};

const leaveForum = async (forumId, user) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can leave forums manually");
  }

  const membership = await ForumMembership.findOne({
    forum: forumId,
    user: user._id,
    status: "active",
  });

  if (!membership) {
    throw new ApiError(404, "Active forum membership not found");
  }

  membership.status = "left";
  membership.leftAt = new Date();
  await membership.save();

  return membership.populate("forum");
};

const joinRecommendedForums = async (user) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can join recommended forums");
  }

  const forums = await getRecommendedForums(user);

  const memberships = [];

  for (const forum of forums) {
    const membership = await ForumMembership.findOneAndUpdate(
      {
        forum: forum._id,
        user: user._id,
      },
      {
        forum: forum._id,
        user: user._id,
        role: "member",
        status: "active",
        leftAt: null,
        joinedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).populate("forum");

    memberships.push(membership);
  }

  return memberships;
};





module.exports = {
  getAllForums,
  createForum,
  getForumById,
  getForumBySlug,
  createForumPost,
  getForumPosts,
  createForumComment,
  getForumPostComments,
  createForumMeeting,
  getForumMeetings,
  getMyForums,
  getExploreForums,
  joinForum,
  leaveForum,
  joinRecommendedForums,
  getRecommendedForums,
};
