import { useMemo, useState } from "react";

function CreateGroupModal({ users = [], onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      const displayName = user.name || user.username || "";
      const email = user.email || "";

      return (
        displayName.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword)
      );
    });
  }, [users, searchTerm]);

  const toggleMember = (userId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onCreateGroup({
      groupName,
      selectedMemberIds,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <div>
            <h3>Create Group</h3>
            <p>Select members for your new group chat</p>
          </div>

          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name</label>

            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Search Members</label>

            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="selected-member-count">
            {selectedMemberIds.length} member(s) selected
          </div>

          <div className="modal-user-list">
            {filteredUsers.length === 0 ? (
              <p className="no-users">No users found</p>
            ) : (
              filteredUsers.map((user) => {
                const userId = user._id || user.id;
                const displayName =
                  user.name || user.username || user.email || "Unknown User";
                const isSelected = selectedMemberIds.includes(userId);

                return (
                  <button
                    key={userId}
                    type="button"
                    className={
                      isSelected
                        ? "modal-user-item selected"
                        : "modal-user-item"
                    }
                    onClick={() => toggleMember(userId)}
                  >
                    <div className="user-avatar">
                      {displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="modal-user-info">
                      <strong>{displayName}</strong>
                      <span>{user.email}</span>
                    </div>

                    <div className="member-checkbox">
                      {isSelected ? "✓" : ""}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="create-button">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
