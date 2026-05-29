const asyncHandler = require("../../utils/asyncHandler");
const supportGroupsService = require("./supportGroups.service");

const getSupportGroups = asyncHandler(async (req, res) => {
  const tags = req.query.tags ? req.query.tags.split(",") : [];

  const groups = await supportGroupsService.getSupportGroups({
    tags,
    language: req.query.language,
    groupType: req.query.groupType,
  });

  res.status(200).json({
    success: true,
    message: "Support groups fetched successfully",
    data: {
      groups,
    },
  });
});

const matchSupportGroup = asyncHandler(async (req, res) => {
  const result = await supportGroupsService.matchSupportGroup(req.user, req.body);

  res.status(200).json({
    success: true,
    message: "Support group matching completed successfully",
    data: result,
  });
});

const createSupportGroup = asyncHandler(async (req, res) => {
  const group = await supportGroupsService.createSupportGroup(req.user, req.body);

  res.status(201).json({
    success: true,
    message: "Support group created successfully",
    data: {
      group,
    },
  });
});

const joinSupportGroup = asyncHandler(async (req, res) => {
  const group = await supportGroupsService.joinSupportGroup(req.user, req.params.groupId);

  res.status(200).json({
    success: true,
    message: "Joined support group successfully",
    data: {
      group,
    },
  });
});

const cancelSupportGroupWaitlist = asyncHandler(async (req, res) => {
  const waitlistEntry = await supportGroupsService.cancelSupportGroupWaitlist(req.user);

  res.status(200).json({
    success: true,
    message: "Support group waitlist entry cancelled successfully",
    data: {
      waitlistEntry,
    },
  });
});

const leaveSupportGroup = asyncHandler(async (req, res) => {
  const result = await supportGroupsService.leaveSupportGroup(req.user, req.params.groupId);

  res.status(200).json({
    success: true,
    message: "Left support group successfully",
    data: result,
  });
});

const getSupportGroup = asyncHandler(async (req, res) => {
  const group = await supportGroupsService.getSupportGroupById(req.params.groupId);

  res.status(200).json({
    success: true,
    message: "Support group fetched successfully",
    data: {
      group,
    },
  });
});

const getSupportGroupMembers = asyncHandler(async (req, res) => {
  const members = await supportGroupsService.getSupportGroupMembers(req.params.groupId);

  res.status(200).json({
    success: true,
    message: "Support group members fetched successfully",
    data: {
      members,
    },
  });
});

const createSupportGroupMeeting = asyncHandler(async (req, res) => {
  const meeting = await supportGroupsService.createSupportGroupMeeting(
    req.user,
    req.params.groupId,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Support group meeting created successfully",
    data: {
      meeting,
    },
  });
});

const getSupportGroupMeetings = asyncHandler(async (req, res) => {
  const meetings = await supportGroupsService.getSupportGroupMeetings(
    req.user,
    req.params.groupId
  );

  res.status(200).json({
    success: true,
    message: "Support group meetings fetched successfully",
    data: {
      meetings,
    },
  });
});

const createSupportGroupMessage = asyncHandler(async (req, res) => {
  const message = await supportGroupsService.createSupportGroupMessage(
    req.user,
    req.params.groupId,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Support group message sent successfully",
    data: {
      message,
    },
  });
});

const getSupportGroupMessages = asyncHandler(async (req, res) => {
  const messages = await supportGroupsService.getSupportGroupMessages(
    req.user,
    req.params.groupId
  );

  res.status(200).json({
    success: true,
    message: "Support group messages fetched successfully",
    data: {
      messages,
    },
  });
});

module.exports = {
  getSupportGroups,
  matchSupportGroup,
  createSupportGroup,
  joinSupportGroup,
  cancelSupportGroupWaitlist,
  leaveSupportGroup,
  getSupportGroup,
  getSupportGroupMembers,
  createSupportGroupMeeting,
  getSupportGroupMeetings,
  createSupportGroupMessage,
  getSupportGroupMessages,
};
