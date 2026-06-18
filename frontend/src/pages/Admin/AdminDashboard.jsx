import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE_URL = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL.replace(/\/api$/, "")
  : RAW_API_URL;

function AdminDashboard() {
  const [overview, setOverview] = useState({
    stats: {},
    recentUsers: [],
    recentGroups: [],
    recentMessages: [],
    messageAnalytics: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE_URL}/api/admin/overview`);

      setOverview({
        stats: response.data?.stats || {},
        recentUsers: response.data?.recentUsers || [],
        recentGroups: response.data?.recentGroups || [],
        recentMessages: response.data?.recentMessages || [],
        messageAnalytics: response.data?.messageAnalytics || [],
      });
    } catch (error) {
      console.error("Admin overview error:", error);

      setError(
        error?.response?.data?.message ||
          "Failed to load admin dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessagePreview = (message) => {
    if (!message) {
      return "";
    }

    if (message.isDeleted) {
      return "This message was deleted";
    }

    if (message.messageType === "image") {
      return "📷 Image";
    }

    if (message.messageType === "file") {
      return `📎 ${message.fileName || "File"}`;
    }

    return message.message || "No message";
  };

  const statsCards = [
    {
      label: "Total Users",
      value: overview.stats.totalUsers || 0,
      icon: "👥",
    },
    {
      label: "Online Users",
      value: overview.stats.onlineUsers || 0,
      icon: "🟢",
    },
    {
      label: "Offline Users",
      value: overview.stats.offlineUsers || 0,
      icon: "⚪",
    },
    {
      label: "Groups",
      value: overview.stats.totalGroups || 0,
      icon: "💬",
    },
    {
      label: "Messages",
      value: overview.stats.totalMessages || 0,
      icon: "✉️",
    },
    {
      label: "Today Messages",
      value: overview.stats.todayMessages || 0,
      icon: "📅",
    },
    {
      label: "Images",
      value: overview.stats.imageMessages || 0,
      icon: "🖼️",
    },
    {
      label: "Files",
      value: overview.stats.fileMessages || 0,
      icon: "📎",
    },
    {
      label: "Edited",
      value: overview.stats.editedMessages || 0,
      icon: "✏️",
    },
    {
      label: "Deleted",
      value: overview.stats.deletedMessages || 0,
      icon: "🗑️",
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>NexTalk AI Admin Dashboard</h1>
          <p>Realtime platform metrics, users, groups, and message activity.</p>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={fetchOverview}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link to="/chat">Back to Chat</Link>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-stats-grid">
        {statsCards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div className="admin-stat-icon">{card.icon}</div>

            <div>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-content-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent Users</h2>
          </div>

          <div className="admin-list">
            {overview.recentUsers.length === 0 ? (
              <p className="admin-empty">No users found</p>
            ) : (
              overview.recentUsers.map((user) => (
                <div key={user._id} className="admin-list-item">
                  <div className="admin-avatar">
                    {(user.name || user.username || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="admin-list-info">
                    <strong>{user.name || user.username}</strong>
                    <span>{user.email}</span>
                    <small>{user.department || "No department"}</small>
                  </div>

                  <span
                    className={
                      user.isOnline
                        ? "admin-status online"
                        : "admin-status offline"
                    }
                  >
                    {user.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent Groups</h2>
          </div>

          <div className="admin-list">
            {overview.recentGroups.length === 0 ? (
              <p className="admin-empty">No groups found</p>
            ) : (
              overview.recentGroups.map((group) => (
                <div key={group._id} className="admin-list-item">
                  <div className="admin-avatar group">
                    {(group.name || "G").charAt(0).toUpperCase()}
                  </div>

                  <div className="admin-list-info">
                    <strong>{group.name}</strong>
                    <span>{group.members?.length || 0} members</span>
                    <small>Created {formatDateTime(group.createdAt)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-header">
            <h2>Recent Messages</h2>
          </div>

          <div className="admin-message-list">
            {overview.recentMessages.length === 0 ? (
              <p className="admin-empty">No messages found</p>
            ) : (
              overview.recentMessages.map((message) => (
                <div key={message._id} className="admin-message-item">
                  <div>
                    <strong>
                      {message.isGroupMessage ? "Group Message" : "Private"}
                    </strong>
                    <p>{getMessagePreview(message)}</p>
                  </div>

                  <span>{formatDateTime(message.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-header">
            <h2>7-Day Message Activity</h2>
          </div>

          <div className="admin-chart">
            {overview.messageAnalytics.length === 0 ? (
              <p className="admin-empty">No analytics available</p>
            ) : (
              overview.messageAnalytics.map((item) => {
                const maxCount = Math.max(
                  ...overview.messageAnalytics.map((entry) => entry.count),
                  1
                );

                const width = `${Math.max((item.count / maxCount) * 100, 4)}%`;

                return (
                  <div key={item.date} className="admin-chart-row">
                    <span>{item.date}</span>

                    <div className="admin-chart-bar-wrapper">
                      <div
                        className="admin-chart-bar"
                        style={{ width }}
                      />
                    </div>

                    <strong>{item.count}</strong>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
