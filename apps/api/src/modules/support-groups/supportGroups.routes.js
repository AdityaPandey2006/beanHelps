const express = require("express");

const auth = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");
const {
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
} = require("./supportGroups.controller");
const {
  matchSupportGroupValidation,
  createSupportGroupValidation,
  createSupportGroupMeetingValidation,
  createSupportGroupMessageValidation,
} = require("./supportGroups.validation");

const router = express.Router();

router.get("/", getSupportGroups);
router.post("/", auth, validateRequest(createSupportGroupValidation), createSupportGroup);
router.post("/match", auth, validateRequest(matchSupportGroupValidation), matchSupportGroup);
router.post("/waitlist/cancel", auth, cancelSupportGroupWaitlist);
router.post("/:groupId/join", auth, joinSupportGroup);
router.post("/:groupId/leave", auth, leaveSupportGroup);

router.get("/:groupId/members", auth, getSupportGroupMembers);//give organiser name, therapist name tags etc.

router.get("/:groupId/meetings", auth, getSupportGroupMeetings);
router.post(
  "/:groupId/meetings",
  auth,
  validateRequest(createSupportGroupMeetingValidation),
  createSupportGroupMeeting
);

router.get("/:groupId/messages", auth, getSupportGroupMessages);
router.post(
  "/:groupId/messages",
  auth,
  validateRequest(createSupportGroupMessageValidation),
  createSupportGroupMessage
);

router.get("/:groupId", getSupportGroup);

module.exports = router;
