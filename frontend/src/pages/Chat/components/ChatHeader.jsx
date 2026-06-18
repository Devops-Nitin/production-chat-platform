function ChatHeader({
  selectedUser,
  selectedGroup,
  onlineUsers = [],
  onOpenProfile,
}) {
  if (selectedGroup) {
    return (
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="header-avatar group-avatar">
            {selectedGroup.name?.charAt(0).toUpperCase() || "G"}
          </div>

          <div>
            <h3>{selectedGroup.name}</h3>
            <p>{selectedGroup.members?.length || 0} members</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="chat-header">
        <div>
          <h3>No chat selected</h3>
        </div>
      </div>
    );
  }

  const selectedUserId = selectedUser._id || selectedUser.id;
  const displayName =
    selectedUser.name || selectedUser.username || selectedUser.email;
  const isOnline = onlineUsers.includes(selectedUserId);

  return (
    <div className="chat-header">
      <button
        type="button"
        className="chat-header-left profile-header-button"
        onClick={() => onOpenProfile(selectedUser, false)}
      >
        {selectedUser.profilePicture ? (
          <img
            src={selectedUser.profilePicture}
            alt={displayName}
            className="header-avatar-image"
          />
        ) : (
          <div className="header-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h3>{displayName}</h3>
          <p>{isOnline ? "Online" : "Offline"}</p>
        </div>
      </button>
    </div>
  );
}

export default ChatHeader;
