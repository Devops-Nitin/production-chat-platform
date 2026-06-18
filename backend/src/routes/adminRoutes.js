import express from "express";

import {
  getAdminStats,
  getRecentUsers,
  getRecentMessages,
  getRecentGroups,
  getMessageAnalytics,
  getAdminOverview,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", getAdminStats);

router.get("/users/recent", getRecentUsers);

router.get("/messages/recent", getRecentMessages);

router.get("/groups/recent", getRecentGroups);

router.get("/analytics/messages", getMessageAnalytics);

router.get("/overview", getAdminOverview);

export default router;
