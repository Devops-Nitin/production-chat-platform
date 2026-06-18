import { useEffect, useState } from "react";

function ProfileModal({
  user,
  isOwnProfile = false,
  onClose,
  onSaveProfile,
}) {
  const [formData, setFormData] = useState({
    username: "",
    statusMessage: "",
    about: "",
    department: "",
    phone: "",
    profilePicture: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || user.name || "",
        statusMessage: user.statusMessage || "",
        about: user.about || "",
        department: user.department || "",
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isOwnProfile) return;

    try {
      setSaving(true);
      await onSaveProfile(formData);
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name || user?.username || user?.email || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="modal-overlay">
      <div className="profile-modal">
        <div className="modal-header">
          <div>
            <h3>{isOwnProfile ? "My Profile" : "User Profile"}</h3>
            <p>{user?.email}</p>
          </div>

          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="profile-top">
          {formData.profilePicture ? (
            <img
              src={formData.profilePicture}
              alt={displayName}
              className="profile-avatar-image"
            />
          ) : (
            <div className="profile-avatar-large">{avatarLetter}</div>
          )}

          <div>
            <h2>{displayName}</h2>
            <p>{formData.statusMessage || "No status message"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="form-group">
            <label>Status Message</label>
            <input
              type="text"
              name="statusMessage"
              value={formData.statusMessage}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="form-group">
            <label>About</label>
            <input
              type="text"
              name="about"
              value={formData.about}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="text"
              name="profilePicture"
              value={formData.profilePicture}
              onChange={handleChange}
              disabled={!isOwnProfile}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Close
            </button>

            {isOwnProfile && (
              <button type="submit" className="create-button" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
