import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message, room, conversationId, messageType } =
      req.body;

    const file = req.file;

    if (!sender) {
      return res.status(400).json({
        message: "Sender is required",
      });
    }

    const isGroupMessage = Boolean(conversationId);

    if (!isGroupMessage && !receiver) {
      return res.status(400).json({
        message: "Receiver is required for private message",
      });
    }

    const finalRoom = isGroupMessage ? conversationId : room;

    if (!finalRoom) {
      return res.status(400).json({
        message: "Room or conversationId is required",
      });
    }

    const fileUrl = file ? `/uploads/${file.filename}` : "";
    const fileName = file ? file.originalname : "";
    const fileMimeType = file ? file.mimetype : "";

    let finalMessageType = messageType || "text";

    if (file) {
      finalMessageType = file.mimetype.startsWith("image/") ? "image" : "file";
    }

    const newMessage = await Message.create({
      sender,
      receiver: isGroupMessage ? "" : receiver,
      conversationId: isGroupMessage ? conversationId : "",
      isGroupMessage,
      message: message || "",
      room: finalRoom,
      messageType: finalMessageType,
      fileUrl,
      fileName,
      fileMimeType,
      status: "sent",
    });

    if (isGroupMessage) {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage._id.toString(),
      });
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};

export const getPrivateMessages = async (req, res) => {
  try {
    const { room } = req.params;

    if (!room) {
      return res.status(400).json({
        message: "Room is required",
      });
    }

    const messages = await Message.find({
      room,
      isGroupMessage: false,
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get private messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch private messages",
    });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    const messages = await Message.find({
      conversationId,
      isGroupMessage: true,
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get group messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch group messages",
    });
  }
};

export const markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        status: "delivered",
        deliveredAt: new Date(),
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Mark delivered error:", error);

    return res.status(500).json({
      message: "Failed to mark message as delivered",
    });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        status: "read",
        readAt: new Date(),
        $addToSet: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Mark read error:", error);

    return res.status(500).json({
      message: "Failed to mark message as read",
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        message: "userId and message are required",
      });
    }

    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (existingMessage.sender !== userId) {
      return res.status(403).json({
        message: "You can edit only your own message",
      });
    }

    if (existingMessage.isDeleted) {
      return res.status(400).json({
        message: "Deleted message cannot be edited",
      });
    }

    existingMessage.message = message;
    existingMessage.isEdited = true;
    existingMessage.editedAt = new Date();

    await existingMessage.save();

    return res.status(200).json(existingMessage);
  } catch (error) {
    console.error("Edit message error:", error);

    return res.status(500).json({
      message: "Failed to edit message",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (existingMessage.sender !== userId) {
      return res.status(403).json({
        message: "You can delete only your own message",
      });
    }

    existingMessage.message = "This message was deleted";
    existingMessage.fileUrl = "";
    existingMessage.fileName = "";
    existingMessage.fileMimeType = "";
    existingMessage.messageType = "text";
    existingMessage.isDeleted = true;
    existingMessage.deletedAt = new Date();

    await existingMessage.save();

    return res.status(200).json(existingMessage);
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      message: "Failed to delete message",
    });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({
        message: "userId and emoji are required",
      });
    }

    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const existingReactionIndex = existingMessage.reactions.findIndex(
      (reaction) => reaction.userId === userId && reaction.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      existingMessage.reactions.splice(existingReactionIndex, 1);
    } else {
      existingMessage.reactions = existingMessage.reactions.filter(
        (reaction) => reaction.userId !== userId
      );

      existingMessage.reactions.push({
        userId,
        emoji,
      });
    }

    await existingMessage.save();

    return res.status(200).json(existingMessage);
  } catch (error) {
    console.error("Toggle reaction error:", error);

    return res.status(500).json({
      message: "Failed to update reaction",
    });
  }
};
