const express = require("express");

const { getDailyQuote } = require("./quotes.controller");

const router = express.Router();

router.get("/daily", getDailyQuote);

module.exports = router;
