import React, { useEffect, useState } from 'react';
import './BrowserSavePassword.css';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';

const BrowserSavePassword = () => {
  const { pendingCredentials, handleBrowserPasswordAction } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const emailDisplay = pendingCredentials?.email || 'user@neplify.stream';

  return (
    <div className="browser-interaction-wrapper">
      {/* Background showing the submitted auth state */}
      <AuthModal />

      {/* Browser UI overlay mockup */}
      <div className="browser-top-bar-mock">
        <div className="browser-tab">
          <span className="browser-tab-favicon">🎬</span>
          <span className="browser-tab-title">Neplify - Watch Movies & TV Shows</span>
          <span className="browser-tab-close">✕</span>
        </div>
        <div className="browser-address-bar">
          <div className="lock-icon">🔒</div>
          <span className="address-text">https://www.neplify.stream/login</span>
          <div className="browser-actions-icons">
            <span className="key-icon-active" title="Password Manager">🔑</span>
            <span className="star-icon">★</span>
          </div>
        </div>
      </div>

      {/* The Floating Browser Password Manager Prompt */}
      <div className={`browser-password-prompt ${isAnimating ? 'prompt-visible' : ''}`}>
        <div className="prompt-arrow-tip"></div>
        <div className="prompt-header">
          <div className="prompt-icon-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#1a73e8">
              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </div>
          <div className="prompt-header-text">
            <h4>Save password?</h4>
            <p>Save password to Google Password Manager for <strong>neplify.stream</strong></p>
          </div>
        </div>

        <div className="prompt-body">
          <div className="credential-field">
            <span className="field-label">Username</span>
            <span className="field-val" title={emailDisplay}>{emailDisplay}</span>
          </div>
          <div className="credential-field">
            <span className="field-label">Password</span>
            <span className="field-val password-dots">•••••••••••••••</span>
          </div>
        </div>

        <div className="prompt-actions">
          <button 
            type="button" 
            className="prompt-btn-secondary"
            onClick={() => handleBrowserPasswordAction('never')}
          >
            Never
          </button>
          <button 
            type="button" 
            className="prompt-btn-primary"
            onClick={() => handleBrowserPasswordAction('save')}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserSavePassword;
