import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";

import UserList from "./components/UserList";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import TypingIndicator from "./components/TypingIndicator";
import CreateGroupModal from "./components/CreateGroupModal";
import ProfileModal from "./components/ProfileModal";

const API_BASE_URL = "";

function Chat() {
  const { user: contextUser, setUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [chatMeta, setChatMeta] = useState({});
  const [groupChatMeta, setGroupChatMeta] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("users");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const safeJsonParse = (value) => {
    try {
      if (!value) return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const decodeJwtUser = () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("chatToken");

      if (!token) return null;

      const payload = token.split(".")[1];

      if (!payload) return null;

      const decodedPayload = JSON.parse(atob(payload));

      return {
        _id: decodedPayload.userId || decodedPayload.id || "",
        id: decodedPayload.userId || decodedPayload.id || "",
        email: decodedPayload.email || "",
      };
    } catch {
      return null;
    }
  };

  const getStoredUser = () => {
    const possibleKeys = [
      "user",
      "authUser",
      "currentUser",
      "chatUser",
      "loggedInUser",
    ];

    for (const key of possibleKeys) {
      const parsedUser = safeJsonParse(localStorage.getItem(key));

      if (parsedUser) {
        return parsedUser;
      }
    }

    return decodeJwtUser();
  };

  const storedUser = getStoredUser();
  const loggedInUser = contextUser || storedUser || null;

  const currentUserId =
    loggedInUser?._id ||
    loggedInUser?.id ||
    loggedInUser?.userId ||
    loggedInUser?.user?._id ||
    loggedInUser?.user?.id ||
    "";

  const currentUser = useMemo(() => {
    return {
      ...loggedInUser,
      _id: currentUserId,
      id: currentUserId,
      username:
        loggedInUser?.username ||
        loggedInUser?.name ||
        loggedInUser?.email ||
        "Current User",
      name:
        loggedInUser?.name ||
        loggedInUser?.username ||
        loggedInUser?.email ||
        "Current User",
      email: loggedInUser?.email || "",
      profilePicture: loggedInUser?.profilePicture || "",
      statusMessage: loggedInUser?.statusMessage || "",
      about: loggedInUser?.about || "",
      department: loggedInUser?.department || "",
      phone: loggedInUser?.phone || "",
    };
  }, [loggedInUser, currentUserId]);

  const normalizeUser = useCallback((userItem) => {
    const userId =
      userItem?._id ||
      userItem?.id ||
      userItem?.userId ||
      userItem?.user?._id ||
      userItem?.user?.id ||
      "";

    const username =
      userItem?.username ||
      userItem?.name ||
      userItem?.email ||
      "Unknown User";

    return {
      ...userItem,
      _id: userId,
      id: userId,
      username,
      name: userItem?.name || username,
      email: userItem?.email || "",
      profilePicture: userItem?.profilePicture || "",
      statusMessage: userItem?.statusMessage || "",
      about: userItem?.about || "",
      department: userItem?.department || "",
      phone: userItem?.phone || "",
      isOnline: userItem?.isOnline || false,
      lastSeen: userItem?.lastSeen || null,
    };
  }, []);

  const normalizeMessage = useCallback((messageItem) => {
    return {
      ...messageItem,
      _id: messageItem?._id || messageItem?.id,
      sender: messageItem?.sender || "",
      receiver: messageItem?.receiver || "",
      conversationId: messageItem?.conversationId || "",
      isGroupMessage: Boolean(messageItem?.isGroupMessage),
      message: messageItem?.message || messageItem?.text || "",
      room: messageItem?.room || "",
      messageType: messageItem?.messageType || "text",
      fileUrl: messageItem?.fileUrl || "",
      fileName: messageItem?.fileName || "",
      fileMimeType: messageItem?.fileMimeType || "",
      status: messageItem?.status || "sent",
      reactions: Array.isArray(messageItem?.reactions)
        ? messageItem.reactions
        : [],
      isEdited: Boolean(messageItem?.isEdited),
      editedAt: messageItem?.editedAt || null,
      isDeleted: Boolean(messageItem?.isDeleted),
      deletedAt: messageItem?.deletedAt || null,
      createdAt: messageItem?.createdAt || new Date().toISOString(),
    };
  }, []);

  const currentRoom = useMemo(() => {
    if (selectedGroup?._id) {
      return selectedGroup._id;
    }

    if (selectedUser?._id || selectedUser?.id) {
      const selectedUserId = selectedUser._id || selectedUser.id;

      if (!currentUserId) {
        return selectedUserId;
      }

      return [currentUserId, selectedUserId].sort().join("-");
    }

    return "";
  }, [currentUserId, selectedUser, selectedGroup]);

  const formatMessageTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const getPreviewText = (message) => {
    if (!message) return "No messages yet";

    if (message.isDeleted) return "This message was deleted";

    if (message.messageType === "image") return "📷 Image";

    if (message.messageType === "file") {
      return `📎 ${message.fileName || "File"}`;
    }

    return message.message || "No message";
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);

      const response = await axios.get(`${API_BASE_URL}/api/users`);

      const responseData = Array.isArray(response.data)
        ? response.data
        : response.data?.users || response.data?.data || [];

      const normalizedUsers = responseData.map(normalizeUser);

      const filteredUsers = currentUserId
        ? normalizedUsers.filter((item) => item._id !== currentUserId)
        : normalizedUsers;

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUserId, normalizeUser]);

  const fetchGroups = useCallback(async () => {
    try {
      if (!currentUserId) {
        setGroups([]);
        return;
      }

      setLoadingGroups(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/conversations/user/${currentUserId}`
      );

      const responseData = Array.isArray(response.data)
        ? response.data
        : response.data?.groups || response.data?.data || [];

      setGroups(responseData);
    } catch (error) {
      console.error("Fetch groups error:", error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, [currentUserId]);

  const fetchMessages = useCallback(async () => {
    try {
      if (!currentRoom) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      const url = selectedGroup
        ? `${API_BASE_URL}/api/messages/group/${selectedGroup._id}`
        : `${API_BASE_URL}/api/messages/private/${currentRoom}`;

      const response = await axios.get(url);

      const responseData = Array.isArray(response.data)
        ? response.data
        : response.data?.messages || response.data?.data || [];

      const normalizedMessages = responseData.map(normalizeMessage);

      setMessages(normalizedMessages);

      const lastMessage = normalizedMessages[normalizedMessages.length - 1];

      if (selectedUser && lastMessage) {
        const selectedUserId = selectedUser._id || selectedUser.id;

        setChatMeta((prev) => ({
          ...prev,
          [selectedUserId]: {
            lastMessage,
          },
        }));

        setUnreadCounts((prev) => ({
          ...prev,
          [selectedUserId]: 0,
        }));
      }

      if (selectedGroup && lastMessage) {
        setGroupChatMeta((prev) => ({
          ...prev,
          [selectedGroup._id]: {
            lastMessage,
          },
        }));

        setGroupUnreadCounts((prev) => ({
          ...prev,
          [selectedGroup._id]: 0,
        }));
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentRoom, selectedGroup, selectedUser, normalizeMessage]);

  const fetchSidebarPreviews = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const privateMeta = {};

      await Promise.all(
        users.map(async (chatUser) => {
          const chatUserId = chatUser._id || chatUser.id;

          if (!chatUserId) return;

          const room = [currentUserId, chatUserId].sort().join("-");

          const response = await axios.get(
            `${API_BASE_URL}/api/messages/private/${room}`
          );

          const responseData = Array.isArray(response.data)
            ? response.data
            : response.data?.messages || response.data?.data || [];

          const normalizedMessages = responseData.map(normalizeMessage);
          const lastMessage = normalizedMessages[normalizedMessages.length - 1];

          if (lastMessage) {
            privateMeta[chatUserId] = {
              lastMessage,
            };
          }
        })
      );

      setChatMeta(privateMeta);
    } catch (error) {
      console.error("Fetch private sidebar previews error:", error);
    }
  }, [users, currentUserId, normalizeMessage]);

  const fetchGroupSidebarPreviews = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const groupMeta = {};

      await Promise.all(
        groups.map(async (group) => {
          const groupId = group._id;

          if (!groupId) return;

          const response = await axios.get(
            `${API_BASE_URL}/api/messages/group/${groupId}`
          );

          const responseData = Array.isArray(response.data)
            ? response.data
            : response.data?.messages || response.data?.data || [];

          const normalizedMessages = responseData.map(normalizeMessage);
          const lastMessage = normalizedMessages[normalizedMessages.length - 1];

          if (lastMessage) {
            groupMeta[groupId] = {
              lastMessage,
            };
          }
        })
      );

      setGroupChatMeta(groupMeta);
    } catch (error) {
      console.error("Fetch group sidebar previews error:", error);
    }
  }, [groups, currentUserId, normalizeMessage]);

  const updateMessageInState = useCallback(
    (updatedMessage) => {
      const normalizedUpdatedMessage = normalizeMessage(updatedMessage);

      setMessages((prev) =>
        prev.map((messageItem) =>
          messageItem._id === normalizedUpdatedMessage._id
            ? normalizedUpdatedMessage
            : messageItem
        )
      );

      if (normalizedUpdatedMessage.isGroupMessage) {
        setGroupChatMeta((prev) => ({
          ...prev,
          [normalizedUpdatedMessage.conversationId]: {
            lastMessage: normalizedUpdatedMessage,
          },
        }));
      } else {
        const otherUserId =
          normalizedUpdatedMessage.sender === currentUserId
            ? normalizedUpdatedMessage.receiver
            : normalizedUpdatedMessage.sender;

        if (otherUserId) {
          setChatMeta((prev) => ({
            ...prev,
            [otherUserId]: {
              lastMessage: normalizedUpdatedMessage,
            },
          }));
        }
      }
    },
    [normalizeMessage, currentUserId]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchSidebarPreviews();
  }, [fetchSidebarPreviews]);

  useEffect(() => {
    fetchGroupSidebarPreviews();
  }, [fetchGroupSidebarPreviews]);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("addUser", currentUserId);

    const handleOnlineUsers = (onlineUserIds) => {
      setOnlineUsers(Array.isArray(onlineUserIds) ? onlineUserIds : []);
    };

    socket.on("getOnlineUsers", handleOnlineUsers);

    return () => {
      socket.off("getOnlineUsers", handleOnlineUsers);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentRoom) return;

    if (selectedGroup) {
      socket.emit("joinGroup", {
        conversationId: selectedGroup._id,
      });
    } else {
      socket.emit("joinRoom", currentRoom);
    }

    fetchMessages();
  }, [currentRoom, selectedGroup, fetchMessages]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (!newMessage) return;

      const normalizedNewMessage = normalizeMessage(newMessage);

      const otherUserId =
        normalizedNewMessage.sender === currentUserId
          ? normalizedNewMessage.receiver
          : normalizedNewMessage.sender;

      if (otherUserId) {
        setChatMeta((prev) => ({
          ...prev,
          [otherUserId]: {
            lastMessage: normalizedNewMessage,
          },
        }));
      }

      if (normalizedNewMessage.room === currentRoom) {
        setMessages((prev) => {
          const exists = prev.some(
            (messageItem) => messageItem._id === normalizedNewMessage._id
          );

          if (exists) return prev;

          return [...prev, normalizedNewMessage];
        });

        return;
      }

      if (
        normalizedNewMessage.receiver === currentUserId &&
        normalizedNewMessage.sender
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [normalizedNewMessage.sender]:
            (prev[normalizedNewMessage.sender] || 0) + 1,
        }));
      }
    };

    const handleReceiveGroupMessage = (newMessage) => {
      if (!newMessage) return;

      const normalizedNewMessage = normalizeMessage(newMessage);

      if (normalizedNewMessage.conversationId) {
        setGroupChatMeta((prev) => ({
          ...prev,
          [normalizedNewMessage.conversationId]: {
            lastMessage: normalizedNewMessage,
          },
        }));
      }

      if (normalizedNewMessage.conversationId === selectedGroup?._id) {
        setMessages((prev) => {
          const exists = prev.some(
            (messageItem) => messageItem._id === normalizedNewMessage._id
          );

          if (exists) return prev;

          return [...prev, normalizedNewMessage];
        });
      } else if (normalizedNewMessage.sender !== currentUserId) {
        setGroupUnreadCounts((prev) => ({
          ...prev,
          [normalizedNewMessage.conversationId]:
            (prev[normalizedNewMessage.conversationId] || 0) + 1,
        }));
      }

      fetchGroups();
    };

    const handleTyping = ({ room, sender }) => {
      if (room === currentRoom && sender !== currentUserId) {
        setTypingUser(sender);
      }
    };

    const handleStopTyping = ({ room }) => {
      if (room === currentRoom) {
        setTypingUser("");
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("receiveGroupMessage", handleReceiveGroupMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDelivered", updateMessageInState);
    socket.on("messageRead", updateMessageInState);
    socket.on("messageEdited", updateMessageInState);
    socket.on("messageDeleted", updateMessageInState);
    socket.on("messageReactionUpdated", updateMessageInState);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("receiveGroupMessage", handleReceiveGroupMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDelivered", updateMessageInState);
      socket.off("messageRead", updateMessageInState);
      socket.off("messageEdited", updateMessageInState);
      socket.off("messageDeleted", updateMessageInState);
      socket.off("messageReactionUpdated", updateMessageInState);
    };
  }, [
    currentRoom,
    currentUserId,
    selectedGroup,
    fetchGroups,
    normalizeMessage,
    updateMessageInState,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSelectUser = (chatUser) => {
    const normalizedSelectedUser = normalizeUser(chatUser);

    setSelectedUser(normalizedSelectedUser);
    setSelectedGroup(null);
    setMessages([]);
    setTypingUser("");
    setSidebarTab("users");

    setUnreadCounts((prev) => ({
      ...prev,
      [normalizedSelectedUser._id]: 0,
    }));
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setMessages([]);
    setTypingUser("");
    setSidebarTab("groups");

    setGroupUnreadCounts((prev) => ({
      ...prev,
      [group._id]: 0,
    }));
  };

  const handleCreateGroup = async ({ groupName, selectedMemberIds }) => {
    try {
      if (!currentUserId) {
        alert("Logged-in user ID not found. Please logout and login again.");
        return;
      }

      if (!groupName || !groupName.trim()) {
        alert("Group name is required.");
        return;
      }

      if (!selectedMemberIds || selectedMemberIds.length === 0) {
        alert("Please select at least one group member.");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/conversations/group`,
        {
          name: groupName.trim(),
          members: selectedMemberIds,
          createdBy: currentUserId,
        }
      );

      const newGroup = response.data;

      setGroups((prev) => [newGroup, ...prev]);
      setSelectedGroup(newGroup);
      setSelectedUser(null);
      setMessages([]);
      setSidebarTab("groups");
      setShowCreateGroupModal(false);
    } catch (error) {
      console.error("Create group error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create group. Please check backend logs."
      );
    }
  };

  const handleSendMessage = async ({ text, file }) => {
    try {
      if (!currentUserId) {
        alert("Current user not found. Please login again.");
        return;
      }

      if (!currentRoom) {
        alert("Please select a user or group first.");
        return;
      }

      if (!text && !file) return;

      const formData = new FormData();

      formData.append("sender", currentUserId);
      formData.append("message", text || "");
      formData.append("room", currentRoom);

      if (selectedGroup) {
        formData.append("conversationId", selectedGroup._id);
      } else if (selectedUser) {
        formData.append("receiver", selectedUser._id || selectedUser.id);
      }

      if (file) {
        formData.append("file", file);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/messages`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const savedMessage = normalizeMessage(response.data);

      setMessages((prev) => {
        const exists = prev.some(
          (messageItem) => messageItem._id === savedMessage._id
        );

        if (exists) return prev;

        return [...prev, savedMessage];
      });

      if (savedMessage.isGroupMessage) {
        setGroupChatMeta((prev) => ({
          ...prev,
          [savedMessage.conversationId]: {
            lastMessage: savedMessage,
          },
        }));
      } else if (selectedUser) {
        setChatMeta((prev) => ({
          ...prev,
          [selectedUser._id || selectedUser.id]: {
            lastMessage: savedMessage,
          },
        }));
      }

      if (selectedGroup) {
        socket.emit("sendGroupMessage", savedMessage);
      } else {
        socket.emit("sendMessage", savedMessage);
      }
    } catch (error) {
      console.error("Send message error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to send message. Please check backend logs."
      );
    }
  };

  const handleEditMessage = async (messageId, updatedText) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/messages/${messageId}/edit`,
        {
          userId: currentUserId,
          message: updatedText,
        }
      );

      updateMessageInState(response.data);

      socket.emit("messageEdited", response.data);
    } catch (error) {
      console.error("Edit message error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to edit message. Please check backend logs."
      );
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this message?"
      );

      if (!confirmDelete) return;

      const response = await axios.patch(
        `${API_BASE_URL}/api/messages/${messageId}/delete`,
        {
          userId: currentUserId,
        }
      );

      updateMessageInState(response.data);

      socket.emit("messageDeleted", response.data);
    } catch (error) {
      console.error("Delete message error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to delete message. Please check backend logs."
      );
    }
  };

  const handleReactMessage = async (messageId, emoji) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/messages/${messageId}/reaction`,
        {
          userId: currentUserId,
          emoji,
        }
      );

      updateMessageInState(response.data);

      socket.emit("messageReactionUpdated", response.data);
    } catch (error) {
      console.error("React message error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to update reaction. Please check backend logs."
      );
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/${currentUserId}/profile`,
        profileData
      );

      const updatedUser = normalizeUser(response.data);

      if (setUser) {
        setUser(updatedUser);
      }

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfileModalUser(updatedUser);
      await fetchUsers();

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Update profile error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to update profile. Please check backend logs."
      );
    }
  };

  const handleOpenProfile = (profileUser, ownProfile = false) => {
    setProfileModalUser(profileUser);
    setIsOwnProfile(ownProfile);
  };

  const handleTyping = () => {
    if (!currentRoom || !currentUserId) return;

    socket.emit("typing", {
      room: currentRoom,
      sender: currentUserId,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        room: currentRoom,
        sender: currentUserId,
      });
    }, 1000);
  };

  const handleStopTyping = () => {
    if (!currentRoom || !currentUserId) return;

    socket.emit("stopTyping", {
      room: currentRoom,
      sender: currentUserId,
    });
  };

  const refreshChatData = async () => {
    await fetchUsers();
    await fetchGroups();
    await fetchSidebarPreviews();
    await fetchGroupSidebarPreviews();

    if (currentRoom) {
      await fetchMessages();
    }
  };

  const activeChat = selectedGroup || selectedUser;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aTime = groupChatMeta[a._id]?.lastMessage?.createdAt
        ? new Date(groupChatMeta[a._id].lastMessage.createdAt).getTime()
        : 0;

      const bTime = groupChatMeta[b._id]?.lastMessage?.createdAt
        ? new Date(groupChatMeta[b._id].lastMessage.createdAt).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [groups, groupChatMeta]);

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button
            type="button"
            className="current-user-profile-button"
            onClick={() => handleOpenProfile(currentUser, true)}
          >
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.name}
                className="sidebar-profile-image"
              />
            ) : (
              <div className="sidebar-profile-avatar">
                {currentUser.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <div>
              <h3>Chats</h3>
              <p className="current-user-name">
                Logged in as {currentUser.name}
              </p>
            </div>
          </button>

          <div className="sidebar-actions">
            <button type="button" onClick={refreshChatData}>
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
            >
              + Group
            </button>
          </div>
        </div>

        <div className="chat-tabs">
          <button
            type="button"
            className={sidebarTab === "users" ? "active" : ""}
            onClick={() => setSidebarTab("users")}
          >
            Users
          </button>

          <button
            type="button"
            className={sidebarTab === "groups" ? "active" : ""}
            onClick={() => setSidebarTab("groups")}
          >
            Groups
          </button>
        </div>

        {sidebarTab === "groups" && (
          <div className="chat-group-section">
            <h4>Groups</h4>

            {loadingGroups ? (
              <p>Loading groups...</p>
            ) : sortedGroups.length === 0 ? (
              <p>No groups yet</p>
            ) : (
              sortedGroups.map((group) => {
                const lastMessage = groupChatMeta[group._id]?.lastMessage;
                const unreadCount = groupUnreadCounts[group._id] || 0;

                return (
                  <button
                    key={group._id}
                    type="button"
                    className={
                      selectedGroup?._id === group._id
                        ? "chat-list-item active"
                        : "chat-list-item"
                    }
                    onClick={() => handleSelectGroup(group)}
                  >
                    <div className="user-avatar">
                      {group.name?.charAt(0).toUpperCase() || "G"}
                    </div>

                    <div className="user-info">
                      <div className="user-top-row">
                        <span className="user-name">{group.name}</span>

                        <span className="chat-time">
                          {formatMessageTime(lastMessage?.createdAt)}
                        </span>
                      </div>

                      <div className="user-bottom-row">
                        <span className="last-message-preview">
                          {getPreviewText(lastMessage)}
                        </span>

                        <span className="user-last-seen">
                          {group.members?.length || 0} members
                        </span>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <span className="unread-badge">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {sidebarTab === "users" && (
          <div className="chat-user-section">
            <h4>Users</h4>

            {loadingUsers ? (
              <p>Loading users...</p>
            ) : (
              <UserList
                users={users}
                selectedUser={selectedUser}
                onlineUsers={onlineUsers}
                unreadCounts={unreadCounts}
                chatMeta={chatMeta}
                onSelectUser={handleSelectUser}
              />
            )}
          </div>
        )}
      </div>

      <div className="chat-main">
        {activeChat ? (
          <>
            <ChatHeader
              selectedUser={selectedUser}
              selectedGroup={selectedGroup}
              onlineUsers={onlineUsers}
              onOpenProfile={handleOpenProfile}
            />

            <MessageList
              messages={messages}
              currentUser={currentUser}
              loading={loadingMessages}
              messagesEndRef={messagesEndRef}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReactMessage={handleReactMessage}
            />

            <TypingIndicator typingUser={typingUser} />

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          <div className="chat-empty">
            <h2>Select a user or group to start chatting</h2>
          </div>
        )}
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal
          users={users}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {profileModalUser && (
        <ProfileModal
          user={profileModalUser}
          isOwnProfile={isOwnProfile}
          onClose={() => {
            setProfileModalUser(null);
            setIsOwnProfile(false);
          }}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}

export default Chat;
