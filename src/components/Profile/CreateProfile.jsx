import React, { useState } from 'react';
import './CreateProfile.css';
import { useAuth } from '../../context/AuthContext';
import { avatarsList, avatarCategories } from '../../data/avatars';
import logo from '../../assets/logo.png';

const CreateProfile = () => {
  const { currentProfile, saveNewProfile, setFlowState, profiles } = useAuth();

  const [name, setName] = useState('Alex');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarsList[0]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isKids, setIsKids] = useState(false);

  const filteredAvatars = activeCategory === 'All'
    ? avatarsList
    : avatarsList.filter((a) => a.category === activeCategory);

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveNewProfile(name.trim(), selectedAvatar, isKids);
  };

  const handleCancel = () => {
    if (profiles && profiles.length > 0) {
      setFlowState('home');
    }
  };

  return (
    <div className="create-profile-container">
      {/* Top Header */}
      <header className="profile-header">
        <img src={logo} alt="Netflix" className="profile-logo" />
      </header>

      <main className="profile-main-wrap">
        <div className="profile-card">
          <h1 className="profile-heading">Create a profile</h1>
          <p className="profile-subheading">
            Add a profile for another person watching with you. Customize your avatar and display name.
          </p>

          <form onSubmit={handleSave} className="profile-form">
            {/* Top Preview & Name Row */}
            <div className="profile-top-bar">
              <div className="circular-preview-container">
                <img
                  src={selectedAvatar.url}
                  alt={selectedAvatar.name}
                  className="circular-avatar-img"
                  style={{ backgroundColor: selectedAvatar.bgColor }}
                />
                <div className="avatar-preview-badge">Selected</div>
              </div>

              <div className="profile-inputs-col">
                <div className="profile-input-wrap">
                  <label htmlFor="profile-name-input">Profile Name</label>
                  <input
                    id="profile-name-input"
                    type="text"
                    className="profile-name-input"
                    placeholder="Enter profile name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={25}
                    required
                  />
                </div>

                <div className="profile-kids-toggle">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={isKids}
                      onChange={(e) => setIsKids(e.target.checked)}
                    />
                    <span className="check-box-square"></span>
                    <span className="kids-label-text">Kid? (Only titles rated 12 and under)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Choose an Avatar Section */}
            <div className="avatar-selection-section">
              <div className="avatar-section-header">
                <div>
                  <h3 className="avatar-section-title">Choose an Avatar</h3>
                  <span className="avatar-count-hint">Select a character for your streaming identity</span>
                </div>

                {/* Category Filters */}
                <div className="avatar-category-pills">
                  {avatarCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Large Responsive Scrollable Avatar Grid */}
              <div className="avatar-grid-scrollable">
                {filteredAvatars.map((avatar) => {
                  const isSelected = selectedAvatar.id === avatar.id;
                  return (
                    <div
                      key={avatar.id}
                      className={`avatar-card ${isSelected ? 'avatar-selected' : ''}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedAvatar(avatar);
                        }
                      }}
                    >
                      <div
                        className="avatar-img-wrap"
                        style={{ backgroundColor: avatar.bgColor }}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="selected-check-badge">
                            ✓
                          </div>
                        )}
                      </div>
                      <span className="avatar-card-name">{avatar.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red Action Buttons */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn">
                Save
              </button>
              {profiles && profiles.length > 0 && (
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateProfile;
