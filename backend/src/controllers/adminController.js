import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const getStartOfToday = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
};

export const getAdminStats = async (req, res) => {
  try {
    const startOfToday = getStartOfToday();

    const [
      totalUsers,
      onlineUsers,
      totalGroups,
      totalMessages,
      todayMessages,
      imageMessages,
      fileMessages,
      deletedMessages,
      editedMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      Conversation.countDocuments({ isGroup: true }),
      Message.countDocuments(),
      Message.countDocuments({
        createdAt: {
          $gte: startOfToday,
        },
      }),
      Message.countDocuments({ messageType: "image" }),
      Message.countDocuments({ messageType: "file" }),
      Message.countDocuments({ isDeleted: true }),
      Message.countDocuments({ isEdited: true }),
    ]);

    return res.status(200).json({
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      totalGroups,
      totalMessages,
      todayMessages,
      imageMessages,
      fileMessages,
      deletedMessages,
      editedMessages,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch admin stats",
    });
  }
};

export const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      id: user._id,
      username: user.username,
      name: user.username,
      email: user.email,
      profilePicture: user.profilePicture || "",
      statusMessage: user.statusMessage || "",
      department: user.department || "",
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Recent users error:", error);

    return res.status(500).json({
      message: "Failed to fetch recent users",
    });
  }
};

export const getRecentMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Recent messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch recent messages",
    });
  }
};

export const getRecentGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ isGroup: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json(groups);
  } catch (error) {
    console.error("Recent groups error:", error);

    return res.status(500).json({
      message: "Failed to fetch recent groups",
    });
  }
};

export const getMessageAnalytics = async (req, res) => {
  try {
    const lastSevenDays = [];

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();

      date.setDate(date.getDate() - index);

      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      );

      const end = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999
      );

      const count = await Message.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      });

      lastSevenDays.push({
        date: start.toISOString().split("T")[0],
        count,
      });
    }

    return res.status(200).json(lastSevenDays);
  } catch (error) {
    console.error("Message analytics error:", error);

    return res.status(500).json({
      message: "Failed to fetch message analytics",
    });
  }
};

export const getAdminOverview = async (req, res) => {
  try {
    const [stats, users, groups, messages, analytics] = await Promise.all([
      Promise.resolve().then(async () => {
        const startOfToday = getStartOfToday();

        const [
          totalUsers,
          onlineUsers,
          totalGroups,
          totalMessages,
          todayMessages,
          imageMessages,
          fileMessages,
          deletedMessages,
          editedMessages,
        ] = await Promise.all([
          User.countDocuments(),
          User.countDocuments({ isOnline: true }),
          Conversation.countDocuments({ isGroup: true }),
          Message.countDocuments(),
          Message.countDocuments({
            createdAt: {
              $gte: startOfToday,
            },
          }),
          Message.countDocuments({ messageType: "image" }),
          Message.countDocuments({ messageType: "file" }),
          Message.countDocuments({ isDeleted: true }),
          Message.countDocuments({ isEdited: true }),
        ]);

        return {
          totalUsers,
          onlineUsers,
          offlineUsers: totalUsers - onlineUsers,
          totalGroups,
          totalMessages,
          todayMessages,
          imageMessages,
          fileMessages,
          deletedMessages,
          editedMessages,
        };
      }),

      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(10),

      Conversation.find({ isGroup: true })
        .sort({ createdAt: -1 })
        .limit(10),

      Message.find()
        .sort({ createdAt: -1 })
        .limit(20),

      Promise.resolve().then(async () => {
        const lastSevenDays = [];

        for (let index = 6; index >= 0; index -= 1) {
          const date = new Date();

          date.setDate(date.getDate() - index);

          const start = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
          );

          const end = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23,
            59,
            59,
            999
          );

          const count = await Message.countDocuments({
            createdAt: {
              $gte: start,
              $lte: end,
            },
          });

          lastSevenDays.push({
            date: start.toISOString().split("T")[0],
            count,
          });
        }

        return lastSevenDays;
      }),
    ]);

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      id: user._id,
      username: user.username,
      name: user.username,
      email: user.email,
      profilePicture: user.profilePicture || "",
      statusMessage: user.statusMessage || "",
      department: user.department || "",
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      stats,
      recentUsers: formattedUsers,
      recentGroups: groups,
      recentMessages: messages,
      messageAnalytics: analytics,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      message: "Failed to fetch admin overview",
    });
  }
};
