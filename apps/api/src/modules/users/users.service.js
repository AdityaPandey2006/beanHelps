const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");
const Forum = require("../../../models/Forum");
const ForumMembership = require("../../../models/ForumMembership");
const SupportGroupMembership = require("../../../models/SupportGroupMembership");
const SupportGroupWaitlist = require("../../../models/SupportGroupWaitlist");
const SupportGroupMeeting = require("../../../models/SupportGroupMeeting");
const ForumMeetingRegistration = require("../../../models/ForumMeetingRegistration");
const { sanitizeUser } = require("../auth/auth.service");

const normalizeTags = (tags = []) => {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
};

const updateOnboarding = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.onboardingProfile = {
    ageRange: payload.ageRange,
    languages: payload.languages,
    location: payload.location,
    preferredGroupSize: payload.preferredGroupSize,
    primaryStruggles: payload.primaryStruggles,
    optionalTags: payload.optionalTags || [],
    description: payload.description || "",
    completedAt: new Date(),
  };

  await user.save();

  return sanitizeUser(user);
};

const getJoinedForums = async (userId) => {
  const memberships = await ForumMembership.find({
    user: userId,
    status: "active",
  })
    .populate("forum")
    .sort({ joinedAt: -1 });

  return memberships
    .map((membership) => membership.forum)
    .filter((forum) => forum?.isActive);
};

const getRecommendedForumsForBeaner = async (user, joinedForums) => {
  const joinedForumIds = joinedForums.map((forum) => forum._id);

  const primaryStruggles = user.onboardingProfile?.primaryStruggles || [];
  const optionalTags = user.onboardingProfile?.optionalTags || [];
  const recommendationTags = normalizeTags([...primaryStruggles, ...optionalTags]);

  const query = {
    _id: { $nin: joinedForumIds },
    isActive: true,
  };

  if (recommendationTags.length) {
    query.tags = { $in: recommendationTags };
  } else {
    query.isFeatured = true;
  }

  return Forum.find(query).sort({ isFeatured: -1, name: 1 }).limit(6);
};

const getActiveSupportGroupForBeaner = async (userId) => {
  const membership = await SupportGroupMembership.findOne({
    user: userId,
    status: "active",
  })
    .populate({
      path: "supportGroup",
      populate: [
        { path: "createdBy", select: "name role" },
        { path: "organizer", select: "name role" },
        { path: "therapist", select: "name role" },
      ],
    })
    .sort({ joinedAt: -1 });

  if (!membership || !membership.supportGroup) {
    return null;
  }

  return {
    membershipRole: membership.role,
    joinedAt: membership.joinedAt,
    group: membership.supportGroup,
  };
};

const getWaitlistStatusForBeaner = async (userId) => {
  return SupportGroupWaitlist.findOne({
    user: userId,
    status: { $in: ["waiting", "matched"] },
  })
    .populate("matchedSupportGroup", "name tags status currentMemberCount capacity")
    .sort({ createdAt: -1 });
};

const getUpcomingSupportGroupMeetings = async (supportGroupId) => {
  if (!supportGroupId) {
    return [];
  }

  return SupportGroupMeeting.find({
    supportGroup: supportGroupId,
    status: "scheduled",
    startsAt: { $gte: new Date() },
  })
    .populate("supportGroup", "name tags")
    .populate("organizer", "name role")
    .sort({ startsAt: 1 })
    .limit(5);
};

const getUpcomingForumMeetingsForBeaner = async (userId) => {
  const registrations = await ForumMeetingRegistration.find({
    user: userId,
    status: "registered",
  })
    .populate({
      path: "meeting",
      match: {
        status: "scheduled",
        startsAt: { $gte: new Date() },
      },
      populate: [
        { path: "forum", select: "name slug" },
        { path: "host", select: "name role" },
      ],
    })
    .sort({ registeredAt: -1 })
    .limit(10);

  return registrations
    .filter((registration) => registration.meeting)
    .map((registration) => ({
      registrationId: registration._id,
      registeredAt: registration.registeredAt,
      meeting: registration.meeting,
    }));
};

const getBeanerHome = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can access this home endpoint");
  }

  const joinedForums = await getJoinedForums(user._id);
  const recommendedForums = await getRecommendedForumsForBeaner(user, joinedForums);
  const supportGroup = await getActiveSupportGroupForBeaner(user._id);
  const waitlistStatus = supportGroup ? null : await getWaitlistStatusForBeaner(user._id);

  const upcomingSupportGroupMeetings = await getUpcomingSupportGroupMeetings(
    supportGroup?.group?._id
  );
  const upcomingForumMeetings = await getUpcomingForumMeetingsForBeaner(user._id);

  return {
    user: sanitizeUser(user),
    joinedForums,
    recommendedForums,
    supportGroup,
    waitlistStatus,
    upcomingForumMeetings,
    upcomingSupportGroupMeetings,
  };
};

module.exports = {
  updateOnboarding,
  getBeanerHome,
};
