import express from "express";

import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserOnlineStatus,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);

router.get("/:userId", getUserById);

router.patch("/:userId/profile", updateUserProfile);

router.patch("/:userId/status", updateUserOnlineStatus);

export default router;
