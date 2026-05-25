//just like health.routes.js, this file will basically 
//store all the routes related to
//the auth folder and this is the file that will be used in 
//the api/routes folder
const express = require("express");

const validateRequest = require("../../middleware/validateRequest");
const { signup, login } = require("./auth.controller");
const { signupValidation, loginValidation } = require("./auth.validation");

const router = express.Router();

router.post("/signup", validateRequest(signupValidation), signup);
router.post("/login", validateRequest(loginValidation), login);

module.exports = router;