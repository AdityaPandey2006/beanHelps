const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");
const Forum = require("../../../models/Forum");
const ForumMeeting = require("../../../models/ForumMeeting");
const ForumMembership = require("../../../models/ForumMembership");
const SupportGroup = require("../../../models/SupportGroup");
const SupportGroupMeeting = require("../../../models/SupportGroupMeeting");
const SupportGroupMembership = require("../../../models/SupportGroupMembership");
const { sanitizeUser } = require("../auth/auth.service");

const getTherapistProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "beanpist") {
    throw new ApiError(403, "Only therapists can access therapist profiles");
  }

  return sanitizeUser(user);
};

const updateTherapistProfile = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "beanpist") {
    throw new ApiError(403, "Only therapists can update therapist profiles");
  }

  user.therapistProfile = {
    ...user.therapistProfile?.toObject?.(),
    specializations: payload.specializations,
    languages: payload.languages,
    experience: payload.experience,
    availability: payload.availability,
    licenseOrCertificateUrl: payload.licenseOrCertificateUrl,
    verificationStatus: user.therapistProfile?.verificationStatus || "pending",
  };

  await user.save();

  return sanitizeUser(user);
};

const getTherapistDashboard = async (user) => {
  const therapistId = user._id;
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [forumMeetings, createdForums, forumMemberships, createdSupportGroups, groupMemberships] =
    await Promise.all([
      ForumMeeting.find({
        host: therapistId,
        status: "scheduled",
        startsAt: { $gte: now, $lte: twoWeeksFromNow },
      })
        .populate("forum", "name slug description")
        .populate("host", "name role")
        .sort({ startsAt: 1 }),
      Forum.find({ createdBy: therapistId, isActive: true }).sort({ name: 1 }),
      ForumMembership.find({ user: therapistId, status: "active" }).populate("forum"),
      SupportGroup.find({ therapist: therapistId, isActive: true })
        .populate("therapist", "name role")
        .populate("organizer", "name role"),
      SupportGroupMembership.find({ user: therapistId, status: "active" }).populate({
        path: "supportGroup",
        populate: [
          { path: "therapist", select: "name role" },
          { path: "organizer", select: "name role" },
        ],
      }),
    ]);

  const therapistGroupIds = createdSupportGroups.map((group) => group._id);

  const supportGroupMeetings = await SupportGroupMeeting.find({
    status: "scheduled",
    startsAt: { $gte: now, $lte: twoWeeksFromNow },
    $or: [{ organizer: therapistId }, { supportGroup: { $in: therapistGroupIds } }],
  })
    .populate("supportGroup", "name description")
    .populate("organizer", "name role")
    .sort({ startsAt: 1 });

  const forumMemberCounts = await Promise.all(
    createdForums.map((forum) =>
      ForumMembership.countDocuments({ forum: forum._id, status: "active" })
    )
  );

  const joinedForums = forumMemberships
    .filter((membership) => {
      const forum = membership.forum;
      return forum && forum.isActive && forum.createdBy?.toString() !== therapistId.toString();
    })
    .map((membership) => ({
      forum: membership.forum,
      membershipRole: membership.role,
      joinedAt: membership.joinedAt,
      isCreatedByUser: false,
    }));

  const createdForumItems = createdForums.map((forum, index) => ({
    forum,
    memberCount: forumMemberCounts[index],
    membershipRole: "creator",
    joinedAt: null,
    isCreatedByUser: true,
  }));

  const joinedSupportGroups = groupMemberships
    .filter((membership) => {
      const group = membership.supportGroup;
      return group && group.isActive && group.createdBy?.toString() !== therapistId.toString();
    })
    .map((membership) => ({
      supportGroup: membership.supportGroup,
      membershipRole: membership.role,
      joinedAt: membership.joinedAt,
      isCreatedByUser: false,
    }));

  const createdSupportGroupItems = createdSupportGroups.map((group) => ({
    supportGroup: group,
    memberCount: group.currentMemberCount,
    capacity: group.capacity,
    membershipRole: "creator",
    joinedAt: null,
    isCreatedByUser: true,
  }));

  return {
    upcomingForumMeetings: forumMeetings,
    upcomingSupportGroupMeetings: supportGroupMeetings,
    createdForums: createdForumItems,
    joinedForums,
    createdSupportGroups: createdSupportGroupItems,
    joinedSupportGroups,
  };
};

module.exports = {
  getTherapistProfile,
  updateTherapistProfile,
  getTherapistDashboard,
};
