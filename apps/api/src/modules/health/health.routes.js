// health.routes.js contains all the routes
// in the health module listed in one place
//you will see that this is the file that is called 
//in the api/routes folder instead of each health api being called seperately

const express = require("express");

const { getHealthStatus } = require("./health.controller");

const router = express.Router();

router.get("/", getHealthStatus);

module.exports = router;
