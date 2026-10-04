import React, { useState } from 'react';
import './CreateProfile.css';
import { useAuth } from '../../context/AuthContext';
import { avatarsList } from '../../data/avatars';

const CreateProfile = () => {
  const { saveNewProfile, setFlowState, profiles } = useAuth();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarsList[0]);

  const handleSave = (e) => {
    e.preventDefault();
    const finalName = name.trim() || 'Alex';
    saveNewProfile(finalName, selectedAvatar, false);
  };

  return (
    <div className="create-profile-screen">
      <div className="create-profile-modal-content">
        <h1 className="create-profile-heading">Create a profile</h1>

        <form onSubmit={handleSave} className="create-profile-form">
          {/* Selected avatar + Name input row */}
          <div className="profile-selected-row">
            <div className="selected-avatar-preview">
              <img
                src={selectedAvatar.url}
                alt={selectedAvatar.name}
              />
            </div>

            <div className="name-input-wrapper">
              <input
                type="text"
                className="name-input-field"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="profile-thin-divider"></div>

          {/* Large dense 13-column scrollable grid of rounded character avatars */}
          <div className="avatars-dense-container">
            <div className="avatars-dense-grid">
              {avatarsList.slice(0, 130).map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <div
                    key={avatar.id}
                    className={`avatar-tile ${isSelected ? 'tile-selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                    title={avatar.name}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedAvatar(avatar);
                      }
                    }}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Centered Dark Red Pill Save Button */}
          <div className="profile-save-action-wrap">
            <button type="submit" className="profile-save-pill-button">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
