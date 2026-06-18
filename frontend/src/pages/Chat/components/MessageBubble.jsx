import { useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function MessageBubble({
  message,
  currentUser,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.message || "");

  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwnMessage = message.sender === currentUserId;

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const reactionSummary = useMemo(() => {
    const summary = {};

    if (!Array.isArray(message.reactions)) {
      return [];
    }

    message.reactions.forEach((reaction) => {
      summary[reaction.emoji] = (summary[reaction.emoji] || 0) + 1;
    });

    return Object.entries(summary).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  }, [message.reactions]);

  const renderStatus = () => {
    if (!isOwnMessage) return null;

    switch (message.status) {
      case "read":
        return <span className="message-status">✓✓ Read</span>;

      case "delivered":
        return <span className="message-status">✓✓ Delivered</span>;

      default:
        return <span className="message-status">✓ Sent</span>;
    }
  };

  const renderFileContent = () => {
    if (!message.fileUrl || message.isDeleted) return null;

    const fileUrl = `${API_URL}${message.fileUrl}`;

    if (message.messageType === "image") {
      return (
        <div className="message-image-container">
          <img
            src={fileUrl}
            alt={message.fileName || "uploaded image"}
            className="message-image"
          />
        </div>
      );
    }

    return (
      <div className="message-file-container">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="message-file-link"
        >
          📎 {message.fileName || "Download File"}
        </a>
      </div>
    );
  };

  const handleSaveEdit = () => {
    if (!editedText.trim()) return;

    onEditMessage(message._id, editedText.trim());
    setIsEditing(false);
  };

  return (
    <div
      className={`message-bubble ${
        isOwnMessage ? "message-own" : "message-other"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {message.isGroupMessage && !isOwnMessage && (
        <div className="message-sender">{message.sender}</div>
      )}

      {isEditing ? (
        <div className="message-edit-box">
          <input
            type="text"
            value={editedText}
            onChange={(event) => setEditedText(event.target.value)}
          />

          <button type="button" onClick={handleSaveEdit}>
            Save
          </button>

          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditedText(message.message || "");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        message.message && (
          <div
            className={
              message.isDeleted ? "message-text deleted" : "message-text"
            }
          >
            {message.message}

            {message.isEdited && !message.isDeleted && (
              <span className="edited-label"> edited</span>
            )}
          </div>
        )
      )}

      {renderFileContent()}

      {reactionSummary.length > 0 && (
        <div className="reaction-summary">
          {reactionSummary.map((reaction) => (
            <span key={reaction.emoji}>
              {reaction.emoji} {reaction.count}
            </span>
          ))}
        </div>
      )}

      <div className="message-footer">
        <span className="message-time">{formattedTime}</span>
        {renderStatus()}
      </div>

      {!message.isDeleted && showActions && (
        <div
          className={
            isOwnMessage
              ? "message-actions own-actions"
              : "message-actions other-actions"
          }
        >
          <button
            type="button"
            onClick={() => setShowReactions((prev) => !prev)}
          >
            🙂
          </button>

          {isOwnMessage && message.messageType === "text" && (
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}

          {isOwnMessage && (
            <button type="button" onClick={() => onDeleteMessage(message._id)}>
              Delete
            </button>
          )}

          {showReactions && (
            <div className="reaction-picker-small">
              {["👍", "❤️", "😂", "😮"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReactMessage(message._id, emoji);
                    setShowReactions(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
