import Conversation from "../models/Conversation.js";

export const createGroupConversation = async (req, res) => {
  try {
    const { name, members, createdBy } = req.body;

    if (!name || !createdBy || !Array.isArray(members)) {
      return res.status(400).json({
        message: "Group name, members, and createdBy are required",
      });
    }

    const uniqueMembers = [...new Set([...members, createdBy])];

    const conversation = await Conversation.create({
      name,
      isGroup: true,
      members: uniqueMembers,
      admins: [createdBy],
      createdBy,
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Create group conversation error:", error);
    return res.status(500).json({
      message: "Failed to create group conversation",
    });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      members: userId,
    }).sort({ updatedAt: -1 });

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Get user conversations error:", error);
    return res.status(500).json({
      message: "Failed to fetch conversations",
    });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: {
          members: userId,
        },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Add group member error:", error);
    return res.status(500).json({
      message: "Failed to add group member",
    });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: {
          members: userId,
          admins: userId,
        },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Remove group member error:", error);
    return res.status(500).json({
      message: "Failed to remove group member",
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndDelete(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return res.status(500).json({
      message: "Failed to delete conversation",
    });
  }
};
