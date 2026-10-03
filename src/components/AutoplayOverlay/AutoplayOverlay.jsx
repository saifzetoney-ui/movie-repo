import React, { useState, useEffect, useRef } from 'react';
import './AutoplayOverlay.css';

const AutoplayOverlay = ({ show, season, nextEpisode, onPlayNow, onCancel, countdownSeconds = 5 }) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setSecondsLeft(countdownSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setSecondsLeft(countdownSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onPlayNow && onPlayNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show, season, nextEpisode]);

  if (!show) return null;

  // Calculate stroke dashoffset for circular progress ring
  const circleRadius = 24;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = secondsLeft / countdownSeconds;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="autoplay-countdown-overlay">
      <div className="autoplay-card">
        <div className="autoplay-left">
          <div className="countdown-ring-wrap">
            <svg width="60" height="60" className="countdown-svg">
              <circle
                cx="30"
                cy="30"
                r={circleRadius}
                className="countdown-circle-bg"
              />
              <circle
                cx="30"
                cy="30"
                r={circleRadius}
                className="countdown-circle-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset
                }}
              />
            </svg>
            <span className="countdown-number">{secondsLeft}</span>
          </div>

          <div className="autoplay-text-content">
            <span className="autoplay-pill-badge">⚡ UP NEXT</span>
            <h4 className="autoplay-ep-title">Season {season} Episode {nextEpisode}</h4>
            <span className="autoplay-timing-note">Starting in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...</span>
          </div>
        </div>

        <div className="autoplay-actions">
          <button
            type="button"
            className="autoplay-play-now-btn"
            onClick={onPlayNow}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Play Now</span>
          </button>

          <button
            type="button"
            className="autoplay-cancel-btn"
            onClick={onCancel}
            title="Cancel autoplay"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoplayOverlay;
