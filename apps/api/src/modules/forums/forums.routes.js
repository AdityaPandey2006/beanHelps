const express = require("express");

const auth = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");

const { createPostValidation, createCommentValidation } = require("./forums.validation");

const { getForums, getForum, getForumBySlug,
    createPost, getPosts,
    createComment, getComments,
 } = require("./forums.controller");

const router = express.Router();

router.get("/", getForums);
router.get("/slug/:slug", getForumBySlug);
//this has to be kept before the /:forumId or the router will think 
// "slug" is a forumId and will give wrong answer everytime

router.get("/posts/:postId/comments", getComments);
router.post("/posts/:postId/comments", auth, validateRequest(createCommentValidation), createComment);

router.get("/:forumId/posts", getPosts);
router.post("/:forumId/posts", auth, validateRequest(createPostValidation), createPost);

router.get("/:forumId", getForum);

module.exports = router;