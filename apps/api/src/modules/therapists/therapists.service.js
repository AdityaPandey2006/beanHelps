const ApiError = require("../../utils/apiError");
const User = require("../../../models/User");
const Forum = require("../../../models/Forum");
const ForumPost = require("../../../models/ForumPost");
const ForumMeeting = require("../../../models/ForumMeeting");
const ForumMeetingRegistration = require("../../../models/ForumMeetingRegistration");
const SupportGroup = require("../../../models/SupportGroup");
const SupportGroupMeeting = require("../../../models/SupportGroupMeeting");
const SupportGroupMessage = require("../../../models/SupportGroupMessage");
const { sanitizeUser } = require("../auth/auth.service");

const isVerifiedTherapist = (user) => {
  return user.role === "beanpist" && user.therapistProfile?.verificationStatus === "verified";
};

const getJoinedForumMeetings = async (therapistId) => {
  const registrations = await ForumMeetingRegistration.find({
    user: therapistId,
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

const updateTherapistProfile = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "beanpist") {
    throw new ApiError(403, "Only therapists can update therapist profiles");
  }

  const currentVerificationStatus =
    user.therapistProfile?.verificationStatus || "pending";

  if (currentVerificationStatus !== "pending") {
    throw new ApiError(
      403,
      "Therapist profile can only be updated while verification is pending"
    );
  }

  user.therapistProfile = {
    ...user.therapistProfile?.toObject?.(),
    specializations: payload.specializations,
    languages: payload.languages,
    experience: payload.experience,
    availability: payload.availability,
    licenseOrCertificateUrl: payload.licenseOrCertificateUrl,
    verificationStatus: "pending",
  };

  await user.save();

  return sanitizeUser(user);
};

const getPendingTherapists = async () => {
  return User.find({
    role: "beanpist",
    "therapistProfile.verificationStatus": "pending",
  }).select("-password");
};

const updateTherapistVerification = async (therapistId, payload) => {
  const therapist = await User.findOne({
    _id: therapistId,
    role: "beanpist",
  });

  if (!therapist) {
    throw new ApiError(404, "Therapist not found");
  }

  if (!therapist.therapistProfile) {
    throw new ApiError(400, "Therapist profile has not been completed");
  }

  therapist.therapistProfile.verificationStatus = payload.verificationStatus;

  await therapist.save();

  return sanitizeUser(therapist);
};

const getTherapistDashboard = async (userId) => {
  const therapist = await User.findById(userId);

  if (!therapist) {
    throw new ApiError(404, "Therapist not found");
  }

  if (therapist.role !== "beanpist") {
    throw new ApiError(403, "Only therapists can access this dashboard");
  }

  const verificationStatus =
    therapist.therapistProfile?.verificationStatus || "pending";

  const canUseTherapistPowers = isVerifiedTherapist(therapist);

  const featuredForums = await Forum.find({
    isActive: true,
    isFeatured: true,
  }).sort({ name: 1 });
  const joinedForumMeetings = await getJoinedForumMeetings(therapist._id);

  if (!canUseTherapistPowers) {
    return {
      user: sanitizeUser(therapist),
      verification: {
        status: verificationStatus,
        canUseTherapistPowers: false,
        message:
          verificationStatus === "rejected"
            ? "Your therapist profile was not verified. You cannot create therapist-led spaces or host sessions right now."
            : "Your therapist profile is still under review. Therapist-only features will unlock after verification.",
      },
      featuredForums,
      assignedSupportGroups: [],
      upcomingForumMeetings: [],
      joinedForumMeetings,
      upcomingSupportGroupMeetings: [],
      recentTherapistPosts: [],
      recentSupportGroupMessages: [],
      insights: {
        assignedSupportGroupsCount: 0,
        upcomingSessionsCount: joinedForumMeetings.length,
        therapistPostsCount: 0,
        recentSupportMessagesCount: 0,
      },
    };
  }

  const assignedSupportGroups = await SupportGroup.find({
    isActive: true,
    status: { $ne: "closed" },
    $or: [
      { therapist: therapist._id },
      { createdBy: therapist._id },
    ],
  })
    .populate("organizer", "name role")
    .populate("therapist", "name role")
    .sort({ updatedAt: -1 });

  const assignedSupportGroupIds = assignedSupportGroups.map((group) => group._id);

  const [
    upcomingForumMeetings,
    upcomingSupportGroupMeetings,
    recentTherapistPosts,
    recentSupportGroupMessages,
    therapistPostsCount,
    recentSupportMessagesCount,
  ] = await Promise.all([
    ForumMeeting.find({
      host: therapist._id,
      status: "scheduled",
      startsAt: { $gte: new Date() },
    })
      .populate("forum", "name slug")
      .sort({ startsAt: 1 })
      .limit(5),

    SupportGroupMeeting.find({
      status: "scheduled",
      startsAt: { $gte: new Date() },
      $or: [
        { organizer: therapist._id },
        { supportGroup: { $in: assignedSupportGroupIds } },
      ],
    })
      .populate("supportGroup", "name tags")
      .populate("organizer", "name role")
      .sort({ startsAt: 1 })
      .limit(5),

    ForumPost.find({
      author: therapist._id,
      isDeleted: false,
      type: { $in: ["therapist_article", "resource"] },
    })
      .populate("forum", "name slug")
      .sort({ createdAt: -1 })
      .limit(5),

    SupportGroupMessage.find({
      supportGroup: { $in: assignedSupportGroupIds },
      isDeleted: false,
    })
      .populate("supportGroup", "name tags")
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .limit(8),

    ForumPost.countDocuments({
      author: therapist._id,
      isDeleted: false,
      type: { $in: ["therapist_article", "resource"] },
    }),

    SupportGroupMessage.countDocuments({
      supportGroup: { $in: assignedSupportGroupIds },
      isDeleted: false,
    }),
  ]);

  return {
    user: sanitizeUser(therapist),
    verification: {
      status: verificationStatus,
      canUseTherapistPowers: true,
      message: "Your therapist profile is verified.",
    },
    featuredForums,
    assignedSupportGroups,
    upcomingForumMeetings,
    joinedForumMeetings,
    upcomingSupportGroupMeetings,
    recentTherapistPosts,
    recentSupportGroupMessages,
    insights: {
      assignedSupportGroupsCount: assignedSupportGroups.length,
      upcomingSessionsCount:
        upcomingForumMeetings.length +
        joinedForumMeetings.length +
        upcomingSupportGroupMeetings.length,
      therapistPostsCount,
      recentSupportMessagesCount,
    },
  };
};

module.exports = {
  updateTherapistProfile,
  getPendingTherapists,
  updateTherapistVerification,
  getTherapistDashboard,
};
