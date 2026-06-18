import express from "express";

import {
  createGroupConversation,
  getUserConversations,
  addGroupMember,
  removeGroupMember,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = express.Router();

router.post("/group", createGroupConversation);

router.get("/user/:userId", getUserConversations);

router.patch("/:conversationId/add-member", addGroupMember);

router.patch("/:conversationId/remove-member", removeGroupMember);

router.delete("/:conversationId", deleteConversation);

export default router;
