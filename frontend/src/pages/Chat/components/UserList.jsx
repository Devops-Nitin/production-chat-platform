import { useMemo, useState } from "react";

function UserList({
  users = [],
  selectedUser,
  onlineUsers = [],
  unreadCounts = {},
  chatMeta = {},
  onSelectUser,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const getUserId = (user) => {
    return user?._id || user?.id;
  };

  const getDisplayName = (user) => {
    return user?.name || user?.username || user?.email || "Unknown User";
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) {
      return "Offline";
    }

    const date = new Date(lastSeen);

    if (Number.isNaN(date.getTime())) {
      return "Offline";
    }

    return `Last seen ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const formatMessageTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

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

  const getPreviewText = (meta) => {
    if (!meta?.lastMessage) {
      return "No messages yet";
    }

    if (meta.lastMessage.isDeleted) {
      return "This message was deleted";
    }

    if (meta.lastMessage.messageType === "image") {
      return "📷 Image";
    }

    if (meta.lastMessage.messageType === "file") {
      return `📎 ${meta.lastMessage.fileName || "File"}`;
    }

    return meta.lastMessage.message || "No message";
  };

  const filteredAndSortedUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const displayName = getDisplayName(user);
      const email = user.email || "";

      if (!keyword) {
        return true;
      }

      return (
        displayName.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword)
      );
    });

    return [...filtered].sort((a, b) => {
      const aId = getUserId(a);
      const bId = getUserId(b);

      const aTime = chatMeta[aId]?.lastMessage?.createdAt
        ? new Date(chatMeta[aId].lastMessage.createdAt).getTime()
        : 0;

      const bTime = chatMeta[bId]?.lastMessage?.createdAt
        ? new Date(chatMeta[bId].lastMessage.createdAt).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [users, searchTerm, chatMeta]);

  const handleSelectUser = (user) => {
    const userId = getUserId(user);
    const displayName = getDisplayName(user);

    onSelectUser({
      ...user,
      _id: userId,
      id: userId,
      name: displayName,
      username: user.username || displayName,
    });
  };

  return (
    <div className="user-list-wrapper">
      <div className="user-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="user-list">
        {filteredAndSortedUsers.length === 0 ? (
          <p className="no-users">No users found</p>
        ) : (
          filteredAndSortedUsers.map((user) => {
            const userId = getUserId(user);
            const selectedUserId = getUserId(selectedUser);
            const displayName = getDisplayName(user);
            const isSelected = selectedUserId === userId;
            const isOnline = onlineUsers.includes(userId);
            const unreadCount = unreadCounts[userId] || 0;
            const meta = chatMeta[userId] || {};
            const previewText = getPreviewText(meta);
            const messageTime = formatMessageTime(meta?.lastMessage?.createdAt);

            return (
              <button
                key={userId}
                type="button"
                className={
                  isSelected
                    ? "chat-list-item user-item active"
                    : "chat-list-item user-item"
                }
                onClick={() => handleSelectUser(user)}
              >
                <div className="user-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="user-info">
                  <div className="user-top-row">
                    <span className="user-name">{displayName}</span>

                    <span className="chat-time">
                      {messageTime}
                    </span>
                  </div>

                  <div className="user-bottom-row">
                    <span className="last-message-preview">
                      {previewText}
                    </span>

                    {!meta?.lastMessage && !isOnline && (
                      <span className="user-last-seen">
                        {formatLastSeen(user.lastSeen)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="user-side-status">
                  <span
                    className={
                      isOnline
                        ? "presence-dot online"
                        : "presence-dot offline"
                    }
                  />

                  {unreadCount > 0 && (
                    <span className="unread-badge">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserList;
