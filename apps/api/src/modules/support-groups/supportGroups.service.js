const ApiError = require("../../utils/apiError");
const SupportGroup = require("../../../models/SupportGroup");
const SupportGroupMembership = require("../../../models/SupportGroupMembership");
const SupportGroupWaitlist = require("../../../models/SupportGroupWaitlist");
const SupportGroupMeeting = require("../../../models/SupportGroupMeeting");
const SupportGroupMessage = require("../../../models/SupportGroupMessage");

const DEFAULT_CAPACITY = 8;
const DEFAULT_MINIMUM_START_SIZE = 6;

const normalizeTags = (tags = []) => {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
};

const calculateTagOverlap = (userTags, groupTags) => {
  const normalizedUserTags = normalizeTags(userTags);
  const normalizedGroupTags = normalizeTags(groupTags);

  return normalizedUserTags.filter((tag) => normalizedGroupTags.includes(tag)).length;
};

const updateGroupStatus = (group) => {
  if (group.currentMemberCount >= group.capacity) {
    group.status = "full";
    return;
  }

  if (group.currentMemberCount < group.minimumStartSize) {
    group.status = "needs_members";
    return;
  }

  group.status = "open";
};

const populateGroup = (query) => {
  return query
    .populate("createdBy", "name displayName role")
    .populate("organizer", "name displayName role")
    .populate("therapist", "name displayName role");
};

const isSameObjectId = (firstId, secondId) => {
  return firstId?.toString() === secondId?.toString();
};

const ensureVerifiedTherapist = (user) => {
  if (user.role === "admin") {
    return;
  }

  if (
    user.role !== "beanpist" ||
    user.therapistProfile?.verificationStatus !== "verified"
  ) {
    throw new ApiError(403, "Only verified therapists can perform this action");
  }
};

const getSupportGroups = async (filters = {}) => {
  const query = {
    isActive: true,
    status: { $ne: "closed" },
  };

  if (filters.tags?.length) {
    query.tags = { $in: normalizeTags(filters.tags) };
  }

  if (filters.language) {
    query.language = filters.language;
  }

  if (filters.groupType && filters.groupType !== "any") {
    query.groupType = filters.groupType;
  }

  return populateGroup(
    SupportGroup.find(query).sort({
      status: 1,
      currentMemberCount: 1,
      createdAt: -1,
    })
  );
};

const ensureUserIsNotInActiveSupportGroup = async (userId) => {
  const existingMembership = await SupportGroupMembership.findOne({
    user: userId,
    status: "active",
  });

  if (existingMembership) {
    throw new ApiError(409, "User is already in an active support group");
  }
};

const ensureUserIsNotWaiting = async (userId) => {
  const existingWaitlistEntry = await SupportGroupWaitlist.findOne({
    user: userId,
    status: "waiting",
  });

  if (existingWaitlistEntry) {
    throw new ApiError(409, "User is already waiting for a support group");
  }
};

const cancelWaitingEntriesForUser = async (userId) => {
  await SupportGroupWaitlist.updateMany(
    {
      user: userId,
      status: "waiting",
    },
    {
      $set: {
        status: "cancelled",
      },
    }
  );
};

const findBestOpenGroup = async ({ tags, language, preferredGroupType }) => {
  const query = {
    isActive: true,
    status: { $in: ["needs_members", "open"] },
    tags: { $in: normalizeTags(tags) },
  };

  if (language) {
    query.language = language;
  }

  if (preferredGroupType && preferredGroupType !== "any") {
    query.groupType = preferredGroupType;
  }

  const groups = await SupportGroup.find(query);

  const rankedGroups = groups
    .map((group) => ({
      group,
      overlapScore: calculateTagOverlap(tags, group.tags),
    }))
    .filter((item) => item.overlapScore > 0 && item.group.currentMemberCount < item.group.capacity)
    .sort((a, b) => {
      if (b.overlapScore !== a.overlapScore) {
        return b.overlapScore - a.overlapScore;
      }

      if (a.group.status !== b.group.status) {
        return a.group.status === "needs_members" ? -1 : 1;
      }

      return a.group.currentMemberCount - b.group.currentMemberCount;
    });

  return rankedGroups[0]?.group || null;
};

const addUserToGroup = async (group, user, role = "member") => {
  if (group.currentMemberCount >= group.capacity) {
    throw new ApiError(400, "Support group is full");
  }

  const existingMembership = await SupportGroupMembership.findOne({
    supportGroup: group._id,
    user: user._id,
  });

  if (existingMembership?.status === "active") {
    throw new ApiError(409, "User is already in this support group");
  }

  if (existingMembership) {
    existingMembership.status = "active";
    existingMembership.role = role;
    existingMembership.joinedAt = new Date();
    existingMembership.leftAt = null;
    await existingMembership.save();
  } else {
    await SupportGroupMembership.create({
      supportGroup: group._id,
      user: user._id,
      role,
    });
  }

  group.currentMemberCount += 1;

  if (!group.organizer) {
    group.organizer = user._id;
  }

  updateGroupStatus(group);
  await group.save();

  return populateGroup(SupportGroup.findById(group._id));
};

const markWaitlistEntryMatched = async (entry, groupId) => {
  entry.status = "matched";
  entry.matchedSupportGroup = groupId;
  entry.matchedAt = new Date();

  await entry.save();
};

const getCommonTags = (entries) => {
  const tagCounts = new Map();

  entries.forEach((entry) => {
    normalizeTags(entry.tags).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => tag);
};

const tryCreateGroupFromWaitlist = async ({ tags, language, preferredGroupType }) => {
  const normalizedTags = normalizeTags(tags);

  const query = {
    status: "waiting",
    tags: { $in: normalizedTags },
  };

  if (language) {
    query.language = language;
  }

  if (preferredGroupType && preferredGroupType !== "any") {
    query.preferredGroupType = { $in: [preferredGroupType, "any"] };
  }

  const waitingEntries = await SupportGroupWaitlist.find(query)
    .populate("user", "name displayName role")
    .sort({ createdAt: 1 });

  const rankedEntries = waitingEntries
    .map((entry) => ({
      entry,
      overlapScore: calculateTagOverlap(normalizedTags, entry.tags),
    }))
    .filter((item) => item.overlapScore > 0)
    .sort((a, b) => {
      if (b.overlapScore !== a.overlapScore) {
        return b.overlapScore - a.overlapScore;
      }

      return a.entry.createdAt - b.entry.createdAt;
    });

  if (rankedEntries.length < DEFAULT_MINIMUM_START_SIZE) {
    return null;
  }

  const selectedEntries = rankedEntries
    .slice(0, DEFAULT_MINIMUM_START_SIZE)
    .map((item) => item.entry);

  const groupTags = getCommonTags(selectedEntries);
  const organizer = selectedEntries[0].user;

  const group = await SupportGroup.create({
    name: `${groupTags.map((tag) => tag[0].toUpperCase() + tag.slice(1)).join(" & ")} Support Circle`,
    description: "Auto-created support circle from the waitlist.",
    tags: groupTags,
    capacity: DEFAULT_CAPACITY,
    minimumStartSize: DEFAULT_MINIMUM_START_SIZE,
    currentMemberCount: 0,
    createdBy: organizer._id,
    organizer: organizer._id,
    groupType: preferredGroupType && preferredGroupType !== "any" ? preferredGroupType : "peer_led",
    language: language || "",
  });

  for (const entry of selectedEntries) {
    const role = entry.user._id.equals(organizer._id) ? "organizer" : "member";

    await addUserToGroup(group, entry.user, role);
    await markWaitlistEntryMatched(entry, group._id);
  }

  return populateGroup(SupportGroup.findById(group._id));
};

const matchSupportGroup = async (user, payload) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can join support groups through matching");
  }

  const tags = normalizeTags(payload.tags);

  if (!tags.length) {
    throw new ApiError(400, "At least one tag is required");
  }

  await ensureUserIsNotInActiveSupportGroup(user._id);

  const bestGroup = await findBestOpenGroup({
    tags,
    language: payload.language,
    preferredGroupType: payload.preferredGroupType,
  });

  if (bestGroup) {
    const group = await addUserToGroup(bestGroup, user);
    await cancelWaitingEntriesForUser(user._id);

    return {
      status: "matched_existing_group",
      group,
      waitlistEntry: null,
    };
  }

  await ensureUserIsNotWaiting(user._id);

  const waitlistEntry = await SupportGroupWaitlist.create({
    user: user._id,
    tags,
    language: payload.language || "",
    preferredGroupType: payload.preferredGroupType || "any",
  });

  const newGroup = await tryCreateGroupFromWaitlist({
    tags,
    language: payload.language,
    preferredGroupType: payload.preferredGroupType,
  });

  if (newGroup) {
    return {
      status: "created_new_group_from_waitlist",
      group: newGroup,
      waitlistEntry: null,
    };
  }

  return {
    status: "waitlisted",
    group: null,
    waitlistEntry,
  };
};

const createSupportGroup = async (creator, payload) => {
  ensureVerifiedTherapist(creator);

  const tags = normalizeTags(payload.tags);

  if (!tags.length) {
    throw new ApiError(400, "At least one tag is required");
  }

  const capacity = payload.capacity || DEFAULT_CAPACITY;
  const minimumStartSize = payload.minimumStartSize || DEFAULT_MINIMUM_START_SIZE;

  if (capacity < 6 || capacity > 10) {
    throw new ApiError(400, "Support group capacity must be between 6 and 10");
  }

  if (minimumStartSize < 2 || minimumStartSize > capacity) {
    throw new ApiError(400, "Minimum start size must be between 2 and the group capacity");
  }

  const group = await SupportGroup.create({
    name: payload.name,
    description: payload.description || "",
    tags,
    capacity,
    minimumStartSize,
    currentMemberCount: 0,
    createdBy: creator._id,
    organizer: creator._id,
    therapist: creator.role === "beanpist" ? creator._id : null,
    groupType: payload.groupType || "therapist_led",
    language: payload.language || "",
  });

  updateGroupStatus(group);
  await group.save();

  return populateGroup(SupportGroup.findById(group._id));
};

const joinSupportGroup = async (user, groupId) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can join support groups");
  }

  await ensureUserIsNotInActiveSupportGroup(user._id);

  const group = await SupportGroup.findOne({
    _id: groupId,
    isActive: true,
    status: { $in: ["needs_members", "open"] },
  });

  if (!group) {
    throw new ApiError(404, "Support group not found or not open");
  }

  const joinedGroup = await addUserToGroup(group, user);
  await cancelWaitingEntriesForUser(user._id);

  return joinedGroup;
};

const cancelSupportGroupWaitlist = async (user) => {
  if (user.role !== "beaner") {
    throw new ApiError(403, "Only beaners can cancel support group waitlist entries");
  }

  const waitlistEntry = await SupportGroupWaitlist.findOne({
    user: user._id,
    status: "waiting",
  }).sort({ createdAt: -1 });

  if (!waitlistEntry) {
    throw new ApiError(404, "No active support group waitlist entry found");
  }

  waitlistEntry.status = "cancelled";
  await waitlistEntry.save();

  return waitlistEntry;
};

const findBestWaitlistedUserForGroup = async (group) => {
  const waitingEntries = await SupportGroupWaitlist.find({
    status: "waiting",
    tags: { $in: normalizeTags(group.tags) },
  })
    .populate("user", "name displayName role")
    .sort({ createdAt: 1 });

  const rankedEntries = waitingEntries
    .map((entry) => ({
      entry,
      overlapScore: calculateTagOverlap(entry.tags, group.tags),
    }))
    .filter((item) => item.overlapScore > 0)
    .sort((a, b) => {
      if (b.overlapScore !== a.overlapScore) {
        return b.overlapScore - a.overlapScore;
      }

      return a.entry.createdAt - b.entry.createdAt;
    });

  return rankedEntries[0]?.entry || null;
};

const assignNextOrganizer = async (group) => {
  const oldestActiveMembership = await SupportGroupMembership.findOne({
    supportGroup: group._id,
    status: "active",
  }).sort({ joinedAt: 1 });

  if (!oldestActiveMembership) {
    group.organizer = null;
    return;
  }

  group.organizer = oldestActiveMembership.user;
  oldestActiveMembership.role = "organizer";
  await oldestActiveMembership.save();
};

const fillOpenSpotFromWaitlist = async (group) => {
  if (group.currentMemberCount >= group.capacity) {
    return null;
  }

  const waitlistEntry = await findBestWaitlistedUserForGroup(group);

  if (!waitlistEntry) {
    return null;
  }

  const updatedGroup = await addUserToGroup(group, waitlistEntry.user);
  await markWaitlistEntryMatched(waitlistEntry, group._id);

  return updatedGroup;
};

const leaveSupportGroup = async (user, groupId) => {
  const membership = await SupportGroupMembership.findOne({
    supportGroup: groupId,
    user: user._id,
    status: "active",
  });

  if (!membership) {
    throw new ApiError(404, "Active support group membership not found");
  }

  const group = await SupportGroup.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Support group not found");
  }

  membership.status = "left";
  membership.leftAt = new Date();
  await membership.save();

  group.currentMemberCount = Math.max(0, group.currentMemberCount - 1);

  if (group.organizer?.equals(user._id)) {
    await assignNextOrganizer(group);
  }

  updateGroupStatus(group);
  await group.save();

  const refilledGroup = await fillOpenSpotFromWaitlist(group);

  return {
    group: refilledGroup || (await populateGroup(SupportGroup.findById(group._id))),
    filledFromWaitlist: Boolean(refilledGroup),
  };
};

const getSupportGroupById = async (groupId) => {
  const group = await populateGroup(
    SupportGroup.findOne({
      _id: groupId,
      isActive: true,
      status: { $ne: "closed" },
    })
  );

  if (!group) {
    throw new ApiError(404, "Support group not found");
  }

  return group;
};

const getSupportGroupMembers = async (groupId) => {
  await getSupportGroupById(groupId);

  return SupportGroupMembership.find({
    supportGroup: groupId,
    status: "active",
  })
    .populate("user", "name displayName role")
    .sort({ role: -1, joinedAt: 1 });
};

const ensureActiveGroupMember = async (userId, groupId) => {
  const membership = await SupportGroupMembership.findOne({
    supportGroup: groupId,
    user: userId,
    status: "active",
  });

  if (!membership) {
    throw new ApiError(403, "Only active support group members can access this");
  }

  return membership;
};

const ensureCanCreateGroupMeeting = async (user, group) => {
  if (user.role === "admin") {
    return;
  }

  if (isSameObjectId(group.therapist?._id || group.therapist, user._id)) {
    ensureVerifiedTherapist(user);
    return;
  }

  const membership = await ensureActiveGroupMember(user._id, group._id);

  if (membership.role !== "organizer" && membership.role !== "therapist") {
    throw new ApiError(403, "Only the organizer or therapist can create support group meetings");
  }
};

const ensureCanViewGroupMeetings = async (user, group) => {
  if (user.role === "admin") {
    return;
  }

  if (isSameObjectId(group.therapist?._id || group.therapist, user._id)) {
    ensureVerifiedTherapist(user);
    return;
  }

  await ensureActiveGroupMember(user._id, group._id);
};

const createSupportGroupMeeting = async (user, groupId, payload) => {
  const group = await getSupportGroupById(groupId);

  await ensureCanCreateGroupMeeting(user, group);

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

  if (payload.isRecurring && !payload.recurrenceRule) {
    throw new ApiError(400, "Recurring meetings require a recurrence rule");
  }

  const meeting = await SupportGroupMeeting.create({
    supportGroup: group._id,
    organizer: user._id,
    title: payload.title,
    description: payload.description || "",
    mode: payload.mode,
    startsAt,
    endsAt,
    meetingLink: payload.meetingLink || "",
    location: payload.location || "",
    isRecurring: payload.isRecurring || false,
    recurrenceRule: payload.recurrenceRule || "",
  });

  return SupportGroupMeeting.findById(meeting._id)
    .populate("supportGroup", "name tags")
    .populate("organizer", "name displayName role");
};

const getSupportGroupMeetings = async (user, groupId) => {
  const group = await getSupportGroupById(groupId);

  await ensureCanViewGroupMeetings(user, group);

  return SupportGroupMeeting.find({
    supportGroup: groupId,
    status: "scheduled",
  })
    .populate("supportGroup", "name tags")
    .populate("organizer", "name displayName role")
    .sort({ startsAt: 1 });
};

const ensureCanAccessGroupChat = async (user, group) => {
  if (user.role === "admin") {
    return;
  }

  if (isSameObjectId(group.therapist?._id || group.therapist, user._id)) {
    ensureVerifiedTherapist(user);
    return;
  }

  await ensureActiveGroupMember(user._id, group._id);
};

const createSupportGroupMessage = async (user, groupId, payload) => {
  const group = await getSupportGroupById(groupId);

  await ensureCanAccessGroupChat(user, group);

  const message = await SupportGroupMessage.create({
    supportGroup: group._id,
    sender: user._id,
    content: payload.content,
    messageType: payload.messageType || "text",
  });

  return SupportGroupMessage.findById(message._id)
    .populate("sender", "name displayName role")
    .populate("supportGroup", "name tags");
};

const getSupportGroupMessages = async (user, groupId) => {
  const group = await getSupportGroupById(groupId);

  await ensureCanAccessGroupChat(user, group);

  return SupportGroupMessage.find({
    supportGroup: groupId,
    isDeleted: false,
  })
    .populate("sender", "name displayName role")
    .sort({ createdAt: 1 });
};

module.exports = {
  getSupportGroups,
  matchSupportGroup,//this is smart matching. the user just puts in tags and prefernces and gets added
  createSupportGroup,
  joinSupportGroup,//this is manual grp joining
  cancelSupportGroupWaitlist,
  leaveSupportGroup,
  getSupportGroupById,
  getSupportGroupMembers,
  createSupportGroupMeeting,
  getSupportGroupMeetings,
  createSupportGroupMessage,
  getSupportGroupMessages,
};
