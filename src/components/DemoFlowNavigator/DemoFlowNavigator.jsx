import React, { useState } from 'react';
import './DemoFlowNavigator.css';
import { useAuth } from '../../context/AuthContext';

const DemoFlowNavigator = ({ onSelectProvider }) => {
  const { flowState, setFlowState, openCreateProfile, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    { id: 'signin', label: '1. Sign In', action: () => { logout(); setFlowState('signin'); } },
    { id: 'signup', label: '2. Sign Up', action: () => { setFlowState('signup'); } },
    { id: 'browser_save_dialog', label: '3. Save Password Prompt', action: () => { setFlowState('browser_save_dialog'); } },
    { id: 'netflix_splash', label: '4. Neplify Splash Screen', action: () => { setFlowState('netflix_splash'); } },
    { id: 'create_profile', label: '5. Create a Profile', action: () => { openCreateProfile(); } },
    { id: 'home', label: '6. Main Streaming Homepage', action: () => { setFlowState('home'); onSelectProvider && onSelectProvider(null); } },
    { id: 'prime_provider', label: '7. Amazon Prime Video Page', action: () => { setFlowState('home'); onSelectProvider && onSelectProvider('prime'); } }
  ];

  return (
    <div className={`demo-flow-navigator ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="demo-flow-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Quickly jump through the reference video sequence"
      >
        <span className="demo-flow-badge-dot"></span>
        <span className="demo-flow-btn-text">Reference Sequence Guide</span>
        <span className="demo-flow-arrow">{isExpanded ? '▼' : '▲'}</span>
      </button>

      {isExpanded && (
        <div className="demo-flow-dropdown">
          <div className="demo-flow-header">
            <h4>Video Reference Sequence</h4>
            <p>Click any stage to inspect or replay the exact flow:</p>
          </div>
          <div className="demo-flow-steps-list">
            {steps.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`demo-step-btn ${flowState === s.id ? 'active' : ''}`}
                onClick={() => {
                  s.action();
                  setIsExpanded(false);
                }}
              >
                <span>{s.label}</span>
                {flowState === s.id && <span className="current-step-indicator">CURRENT</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoFlowNavigator;
