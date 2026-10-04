import React, { useState, useEffect } from 'react';
import './RemoteControl.css';
import { useTvRemote } from '../../context/TvRemoteContext';

const RemoteControl = () => {
  const {
    isRemoteOpen,
    setIsRemoteOpen,
    soundEnabled,
    setSoundEnabled,
    hudMessage,
    volume,
    isMuted,
    navigateDirection,
    pressOk,
    pressBack,
    pressHome,
    pressColor,
    pressMedia,
    pressChannel,
    scrollPage,
    pressNumber,
    adjustVolume
  } = useTvRemote();

  const [activeLed, setActiveLed] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [powerOn, setPowerOn] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger LED flash on any button press
  const flashLed = () => {
    setActiveLed(true);
    setTimeout(() => setActiveLed(false), 200);
  };

  const handleAction = (callback) => {
    flashLed();
    if (callback) callback();
  };

  return (
    <>
      {/* Sleek Floating TV Screen HUD Toast Notification */}
      {hudMessage && (
        <div className="tv-hud-toast animate-slide-down">
          <span className="tv-hud-icon">{hudMessage.icon}</span>
          <span className="tv-hud-text">{hudMessage.text}</span>
          <span className="tv-hud-badge">REMOTE</span>
        </div>
      )}

      {/* Floating On-Screen "Click to Scroll" Fast Row Jump Buttons */}
      <div className="tv-click-scroll-container">
        {hasScrolled && (
          <button
            type="button"
            className="tv-click-scroll-btn scroll-top-btn"
            onClick={() => handleAction(() => scrollPage('up'))}
            title="Click to Scroll to Top (PageUp)"
          >
            <span className="scroll-btn-arrow">▲</span>
            <span className="scroll-btn-text">Top</span>
          </button>
        )}
        <button
          type="button"
          className="tv-click-scroll-btn scroll-next-btn"
          onClick={() => handleAction(() => scrollPage('down'))}
          title="Click to Scroll Down to Next Movie Row (PageDown / Down)"
        >
          <span className="scroll-btn-arrow">▼</span>
          <span className="scroll-btn-text">Next Row</span>
        </button>
      </div>

      {/* Floating Remote Control Launcher Button */}
      <button
        type="button"
        className={`tv-remote-floating-toggle ${isRemoteOpen ? 'active' : ''}`}
        onClick={() => setIsRemoteOpen(!isRemoteOpen)}
        title="Toggle TV Remote Control Simulator (Shortcut: F2)"
      >
        <span className="remote-toggle-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="4"></rect>
            <circle cx="12" cy="7" r="1.5"></circle>
            <circle cx="12" cy="14" r="3"></circle>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </span>
        <span className="remote-toggle-label">TV Remote</span>
        <span className="remote-toggle-hint">F2</span>
      </button>

      {/* Slide-out TV Remote Control Dock */}
      {isRemoteOpen && (
        <div className="tv-remote-overlay" onClick={() => setIsRemoteOpen(false)}>
          <div
            className="tv-virtual-remote animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Smart TV Remote Control"
          >
            {/* Top IR Emitter & LED */}
            <div className="remote-top-sensor">
              <div className={`remote-ir-led ${activeLed ? 'flashing' : ''}`}></div>
            </div>

            {/* Remote Header */}
            <div className="remote-header">
              <div className="remote-brand">
                <span className="brand-dot"></span>
                <span className="brand-text">NEPLIFY TV</span>
              </div>
              <div className="remote-header-actions">
                <button
                  type="button"
                  className={`remote-sound-btn ${soundEnabled ? 'on' : 'off'}`}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute Remote Beep Sound' : 'Enable Remote Beep Sound'}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
                <button
                  type="button"
                  className="remote-close-btn"
                  onClick={() => setIsRemoteOpen(false)}
                  title="Close Remote (F2)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Power & Top Row */}
            <div className="remote-row remote-top-row">
              <button
                type="button"
                className={`remote-btn btn-power ${powerOn ? 'powered' : ''}`}
                onClick={() => handleAction(() => {
                  setPowerOn(!powerOn);
                  flashLed();
                })}
                title="Power Button"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </button>

              <button
                type="button"
                className={`remote-btn btn-num-toggle ${showKeypad ? 'active' : ''}`}
                onClick={() => setShowKeypad(!showKeypad)}
                title="Toggle Number Keypad"
              >
                123
              </button>

              <button
                type="button"
                className="remote-btn btn-search-top"
                onClick={() => handleAction(() => pressColor('red'))}
                title="Search"
              >
                🔍
              </button>
            </div>

            {/* Collapsible Number Keypad */}
            {showKeypad && (
              <div className="remote-number-pad animate-fade-in">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                  <button
                    key={num}
                    type="button"
                    className="remote-num-btn"
                    onClick={() => handleAction(() => pressNumber(num))}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {/* Circular D-Pad */}
            <div className="remote-dpad-container">
              <div className="remote-dpad-rim">
                {/* UP */}
                <button
                  type="button"
                  className="dpad-btn dpad-up"
                  onClick={() => handleAction(() => navigateDirection('up'))}
                  title="Up (ArrowUp)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="12 4 4 15 20 15"></polygon>
                  </svg>
                </button>

                {/* LEFT */}
                <button
                  type="button"
                  className="dpad-btn dpad-left"
                  onClick={() => handleAction(() => navigateDirection('left'))}
                  title="Left (ArrowLeft)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="4 12 15 4 15 20"></polygon>
                  </svg>
                </button>

                {/* OK / SELECT */}
                <button
                  type="button"
                  className="dpad-btn dpad-center-ok"
                  onClick={() => handleAction(() => pressOk())}
                  title="Select / OK (Enter)"
                >
                  <span>OK</span>
                </button>

                {/* RIGHT */}
                <button
                  type="button"
                  className="dpad-btn dpad-right"
                  onClick={() => handleAction(() => navigateDirection('right'))}
                  title="Right (ArrowRight)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="20 12 9 4 9 20"></polygon>
                  </svg>
                </button>

                {/* DOWN */}
                <button
                  type="button"
                  className="dpad-btn dpad-down"
                  onClick={() => handleAction(() => navigateDirection('down'))}
                  title="Down (ArrowDown)"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="12 20 4 9 20 9"></polygon>
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Trio: Back, Home, Exit */}
            <div className="remote-row remote-nav-trio">
              <button
                type="button"
                className="remote-nav-btn"
                onClick={() => handleAction(() => pressBack())}
                title="Back / Return (Esc / 10009 / 461)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 14 4 9 9 4"></polyline>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg>
                <span>Back</span>
              </button>

              <button
                type="button"
                className="remote-nav-btn btn-home-main"
                onClick={() => handleAction(() => pressHome())}
                title="Home (Return to Main Screen)"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Home</span>
              </button>

              <button
                type="button"
                className="remote-nav-btn"
                onClick={() => handleAction(() => pressColor('blue'))}
                title="Surprise Me (Roulette)"
              >
                <span style={{ fontSize: '18px' }}>🎲</span>
                <span>Surprise</span>
              </button>
            </div>

            {/* Quick Click-to-Scroll Row Jumper */}
            <div className="remote-row remote-scroll-row">
              <button
                type="button"
                className="remote-scroll-action-btn"
                onClick={() => handleAction(() => scrollPage('up'))}
                title="Click to Scroll Up to Previous Row (PageUp)"
              >
                <span>▲</span>
                <span>Row Up</span>
              </button>
              <button
                type="button"
                className="remote-scroll-action-btn scroll-down-primary"
                onClick={() => handleAction(() => scrollPage('down'))}
                title="Click to Scroll Down to Next Row (PageDown)"
              >
                <span>▼</span>
                <span>Row Down</span>
              </button>
            </div>

            {/* Smart TV Color Shortcut Buttons (Red, Green, Yellow, Blue) */}
            <div className="remote-color-bar">
              <button
                type="button"
                className="color-btn color-red"
                onClick={() => handleAction(() => pressColor('red'))}
                title="Red Button: Search"
              >
                <span></span>
                <label>Search</label>
              </button>

              <button
                type="button"
                className="color-btn color-green"
                onClick={() => handleAction(() => pressColor('green'))}
                title="Green Button: My List"
              >
                <span></span>
                <label>My List</label>
              </button>

              <button
                type="button"
                className="color-btn color-yellow"
                onClick={() => handleAction(() => pressColor('yellow'))}
                title="Yellow Button: Live TV"
              >
                <span></span>
                <label>Live TV</label>
              </button>

              <button
                type="button"
                className="color-btn color-blue"
                onClick={() => handleAction(() => pressColor('blue'))}
                title="Blue Button: Roulette"
              >
                <span></span>
                <label>Roulette</label>
              </button>
            </div>

            {/* Rockers: Volume & Channel / Page */}
            <div className="remote-rockers-row">
              {/* Volume Rocker */}
              <div className="remote-rocker-col">
                <span className="rocker-label">VOL</span>
                <div className="rocker-control">
                  <button
                    type="button"
                    className="rocker-btn rocker-up"
                    onClick={() => handleAction(() => adjustVolume('up'))}
                    title="Volume Up"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={`rocker-btn rocker-mid ${isMuted ? 'muted' : ''}`}
                    onClick={() => handleAction(() => adjustVolume('mute'))}
                    title="Mute Volume"
                  >
                    {isMuted ? '🔇' : '🔈'}
                  </button>
                  <button
                    type="button"
                    className="rocker-btn rocker-down"
                    onClick={() => handleAction(() => adjustVolume('down'))}
                    title="Volume Down"
                  >
                    –
                  </button>
                </div>
              </div>

              {/* Channel / Page Rocker */}
              <div className="remote-rocker-col">
                <span className="rocker-label">PAGE / CH</span>
                <div className="rocker-control">
                  <button
                    type="button"
                    className="rocker-btn rocker-up"
                    onClick={() => handleAction(() => pressChannel('up'))}
                    title="Page Up / Channel Up (PageUp / 427)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="rocker-btn rocker-mid"
                    onClick={() => handleAction(() => pressColor('yellow'))}
                    title="Live TV Guide"
                  >
                    📺
                  </button>
                  <button
                    type="button"
                    className="rocker-btn rocker-down"
                    onClick={() => handleAction(() => pressChannel('down'))}
                    title="Page Down / Channel Down (PageDown / 428)"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Media Playback Controls */}
            <div className="remote-media-bar">
              <button
                type="button"
                className="remote-media-btn"
                onClick={() => handleAction(() => pressMedia('rewind'))}
                title="Rewind 10s (MediaRewind)"
              >
                ⏪
              </button>
              <button
                type="button"
                className="remote-media-btn btn-play-pause"
                onClick={() => handleAction(() => pressMedia('playPause'))}
                title="Play / Pause (MediaPlayPause)"
              >
                ⏯️
              </button>
              <button
                type="button"
                className="remote-media-btn"
                onClick={() => handleAction(() => pressMedia('fastForward'))}
                title="Fast Forward 10s (MediaFastForward)"
              >
                ⏩
              </button>
            </div>

            {/* TV Compatibility Badges */}
            <div className="remote-bottom-badges">
              <span className="compat-tag">SAMSUNG TIZEN</span>
              <span className="compat-tag">LG WEBOS</span>
              <span className="compat-tag">ANDROID TV</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RemoteControl;
