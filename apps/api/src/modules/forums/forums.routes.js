const express = require("express");

const auth = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");

const { createPostValidation, createCommentValidation,
    createMeetingValidation,
 } = require("./forums.validation");

const { getForums, getForum, getForumBySlug,
    createPost, getPosts,
    createComment, getComments,
    createMeeting, getMeetings,
    getMyForums, getExploreForums, getRecommendedForums, joinForum, leaveForum, joinRecommendedForums,
 } = require("./forums.controller");

const router = express.Router();

router.get("/", getForums);
router.get("/slug/:slug", getForumBySlug);
//this has to be kept before the /:forumId or the router will think 
// "slug" is a forumId and will give wrong answer everytime

router.get("/my", auth, getMyForums);
router.get("/explore", auth, getExploreForums);

router.get("/recommended", auth, getRecommendedForums);
router.post("/recommended/join-all", auth, joinRecommendedForums);

router.post("/:forumId/join", auth, joinForum);
router.post("/:forumId/leave", auth, leaveForum);

router.get("/posts/:postId/comments", getComments);
router.post("/posts/:postId/comments", auth, validateRequest(createCommentValidation), createComment);

router.get("/:forumId/posts", getPosts);
router.post("/:forumId/posts", auth, validateRequest(createPostValidation), createPost);

router.get("/:forumId/meetings", getMeetings);
router.post("/:forumId/meetings", auth, validateRequest(createMeetingValidation), createMeeting);

router.get("/:forumId", getForum);

module.exports = router;