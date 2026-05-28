const express = require("express");

const healthRoutes = require("../modules/health/health.routes");
const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const therapistsRoutes = require("../modules/therapists/therapists.routes");
const forumsRoutes = require("../modules/forums/forums.routes");
const supportGroupsRoutes = require("../modules/support-groups/supportGroups.routes");
const reportsRoutes = require("../modules/reports/reports.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/therapists", therapistsRoutes);
router.use("/forums", forumsRoutes);
router.use("/support-groups",supportGroupsRoutes);
router.use("/reports", reportsRoutes);

module.exports = router;
