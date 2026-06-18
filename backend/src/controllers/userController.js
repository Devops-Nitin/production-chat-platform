import User from "../models/User.js";

const formatUser = (user) => {
  return {
    _id: user._id,
    id: user._id,
    username: user.username,
    name: user.username,
    email: user.email,
    profilePicture: user.profilePicture || "",
    statusMessage: user.statusMessage || "",
    about: user.about || "",
    department: user.department || "",
    phone: user.phone || "",
    isOnline: user.isOnline || false,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ username: 1 });

    return res.status(200).json(users.map(formatUser));
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(formatUser(user));
  } catch (error) {
    console.error("Get user by id error:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      username,
      profilePicture,
      statusMessage,
      about,
      department,
      phone,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(username !== undefined && { username }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(statusMessage !== undefined && { statusMessage }),
        ...(about !== undefined && { about }),
        ...(department !== undefined && { department }),
        ...(phone !== undefined && { phone }),
      },
      {
        new: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(formatUser(updatedUser));
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

export const updateUserOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isOnline: Boolean(isOnline),
        lastSeen: Boolean(isOnline) ? undefined : new Date(),
      },
      {
        new: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(formatUser(updatedUser));
  } catch (error) {
    console.error("Update online status error:", error);

    return res.status(500).json({
      message: "Failed to update online status",
    });
  }
};
