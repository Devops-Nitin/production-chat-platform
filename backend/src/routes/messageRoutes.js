import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  sendMessage,
  getPrivateMessages,
  getGroupMessages,
  markMessageAsDelivered,
  markMessageAsRead,
  editMessage,
  deleteMessage,
  toggleReaction,
} from "../controllers/messageController.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/", upload.single("file"), sendMessage);

router.get("/private/:room", getPrivateMessages);

router.get("/group/:conversationId", getGroupMessages);

router.patch("/:messageId/delivered", markMessageAsDelivered);

router.patch("/:messageId/read", markMessageAsRead);

router.patch("/:messageId/edit", editMessage);

router.patch("/:messageId/delete", deleteMessage);

router.patch("/:messageId/reaction", toggleReaction);

export default router;
