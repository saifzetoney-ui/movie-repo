import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TvRemoteContext = createContext(null);

// Audio synthesizer for TV remote click sounds using Web Audio API
class TvSoundController {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  play(type = 'nav') {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      if (type === 'nav') {
        // Subtle soft click for D-pad move
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'select') {
        // Cheerful double harmonic click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'back') {
        // Downward soft blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'color') {
        // High pleasant chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio playback fails silently if blocked by user-gesture policy
    }
  }
}

const soundCtrl = new TvSoundController();

const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex="0"]',
  '.movie-card',
  '.sidebar-nav-item',
  '.category-pill',
  '.channel-card',
  '.btn-quick-playlist',
  '.tv-focusable'
].join(', ');

export const TvRemoteProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hudMessage, setHudMessage] = useState(null);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [lastDirection, setLastDirection] = useState(null);
  const [focusedElement, setFocusedElement] = useState(null);

  const hudTimerRef = useRef(null);

  const showHud = useCallback((text, icon = '📺', duration = 2000) => {
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    setHudMessage({ text, icon });
    hudTimerRef.current = setTimeout(() => {
      setHudMessage(null);
    }, duration);
  }, []);

  const playSound = useCallback((type) => {
    if (soundEnabled) {
      soundCtrl.play(type);
    }
  }, [soundEnabled]);

  // Find all currently visible focusable elements
  const getFocusableElements = useCallback(() => {
    // If a modal is open, trap focus within that modal
    const modal = document.querySelector('.modal-content, .roulette-modal, .shortcuts-modal-card, .custom-m3u-card');
    const container = modal || document.body;

    const all = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    return all.filter(el => {
      // Ignore elements inside the virtual remote itself during general navigation
      if (!modal && el.closest('.tv-virtual-remote')) return false;

      // Check visibility
      if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }, []);

  // Set focus with TV styling & auto-scroll
  const applyFocus = useCallback((el, reason = 'nav') => {
    if (!el) return;

    // Remove old focus indicator
    document.querySelectorAll('.tv-focused').forEach(old => {
      if (old !== el) old.classList.remove('tv-focused');
    });

    el.classList.add('tv-focused');
    setFocusedElement(el);

    // Call native focus
    if (typeof el.focus === 'function') {
      try {
        el.focus({ preventScroll: true });
      } catch (err) {}
    }

    // Auto-scroll horizontal container (like carousel .card-list or pills row)
    const horizontalContainer = el.closest('.card-list, .category-pills-list, .category-pills-row, .playlist-quick-bar');
    if (horizontalContainer) {
      const containerRect = horizontalContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollOffset = (elRect.left + elRect.width / 2) - (containerRect.left + containerRect.width / 2);
      horizontalContainer.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }

    // Auto-scroll vertical viewport so the section/row is framed in the optimal viewing spot
    const section = el.closest('.title-cards-section, .hero, .search-results-section, .my-list-section, .livetv-player-wrapper');
    if (section) {
      const secRect = section.getBoundingClientRect();
      if (secRect.top < 80 || secRect.bottom > window.innerHeight - 60) {
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      const rect = el.getBoundingClientRect();
      const margin = 100;
      if (rect.top < margin || rect.bottom > window.innerHeight - margin) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    playSound(reason);
  }, [playSound]);

  // Fast Click-to-Scroll / Page-Down / Page-Up
  const scrollPage = useCallback((direction) => {
    playSound('nav');
    const sections = Array.from(document.querySelectorAll(
      '.hero, .left-category-bar, .title-cards-section, .my-list-section, .search-results-section, .channel-grid-section, .livetv-controls-bar'
    ));

    if (direction === 'down') {
      // Find the first section below current viewport top
      const nextSection = sections.find(sec => {
        const rect = sec.getBoundingClientRect();
        return rect.top > 120;
      });

      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusTarget = nextSection.querySelector('.movie-card, .category-pill, .btn, .channel-card, [tabindex="0"]');
        if (focusTarget) {
          setTimeout(() => applyFocus(focusTarget, 'nav'), 300);
        }
        const titleEl = nextSection.querySelector('.section-title, .search-heading, .livetv-title, h2');
        const title = titleEl ? titleEl.textContent.replace(/[^\w\s-]/g, '').trim() : 'Next Row';
        showHud(`Scrolled: ${title}`, '▼');
      } else {
        window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
        showHud('Scrolled Down', '▼');
      }
    } else {
      // Find section immediately above
      const prevSections = sections.filter(sec => {
        const rect = sec.getBoundingClientRect();
        return rect.top < -80;
      });

      if (prevSections.length > 0) {
        const prevSection = prevSections[prevSections.length - 1];
        prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusTarget = prevSection.querySelector('.movie-card, .category-pill, .btn, .channel-card, [tabindex="0"]');
        if (focusTarget) {
          setTimeout(() => applyFocus(focusTarget, 'nav'), 300);
        }
        const titleEl = prevSection.querySelector('.section-title, .search-heading, .livetv-title, h2');
        const title = titleEl ? titleEl.textContent.replace(/[^\w\s-]/g, '').trim() : 'Previous Row';
        showHud(`Scrolled: ${title}`, '▲');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const firstFocus = document.querySelector('.btn-primary, .sidebar-nav-item');
        if (firstFocus) applyFocus(firstFocus, 'nav');
        showHud('Top of Page', '▲');
      }
    }
  }, [applyFocus, playSound, showHud]);

  // Directional spatial navigation with Row-by-Row awareness
  const navigateDirection = useCallback((direction) => {
    setLastDirection(direction);
    const focusables = getFocusableElements();
    if (focusables.length === 0) return;

    let current = document.activeElement;
    if (!current || !focusables.includes(current)) {
      current = document.querySelector('.tv-focused') || focusables[0];
      applyFocus(current, 'nav');
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const candidate of focusables) {
      if (candidate === current) continue;

      const candRect = candidate.getBoundingClientRect();
      const candCenter = {
        x: candRect.left + candRect.width / 2,
        y: candRect.top + candRect.height / 2
      };

      const dx = candCenter.x - currentCenter.x;
      const dy = candCenter.y - currentCenter.y;

      let isValidDirection = false;
      let score = Infinity;

      if (direction === 'up') {
        if (dy < -4) {
          isValidDirection = true;
          const primaryDist = Math.abs(dy);
          const secondaryDist = Math.abs(dx);
          score = primaryDist + secondaryDist * 1.5;
        }
      } else if (direction === 'down') {
        if (dy > 4) {
          isValidDirection = true;
          const primaryDist = Math.abs(dy);
          const secondaryDist = Math.abs(dx);
          score = primaryDist + secondaryDist * 1.5;
        }
      } else if (direction === 'left') {
        if (dx < -4) {
          isValidDirection = true;
          const primaryDist = Math.abs(dx);
          const secondaryDist = Math.abs(dy);
          score = primaryDist + secondaryDist * 3.0;
        }
      } else if (direction === 'right') {
        if (dx > 4) {
          isValidDirection = true;
          const primaryDist = Math.abs(dx);
          const secondaryDist = Math.abs(dy);
          score = primaryDist + secondaryDist * 3.0;
        }
      }

      if (isValidDirection && score < minDistance) {
        minDistance = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      applyFocus(bestCandidate, 'nav');
    } else if (direction === 'down') {
      // If at bottom of candidates, scroll page down
      scrollPage('down');
    } else if (direction === 'up') {
      scrollPage('up');
    }
  }, [getFocusableElements, applyFocus, scrollPage]);

  // OK / Select Action
  const pressOk = useCallback(() => {
    let current = document.activeElement;
    if (!current || current === document.body) {
      current = document.querySelector('.tv-focused');
    }

    if (current) {
      playSound('select');
      current.click();

      // If it's an input, focus and select
      if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') {
        current.focus();
      }
    } else {
      // Focus first element
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        applyFocus(focusables[0], 'select');
      }
    }
  }, [getFocusableElements, applyFocus, playSound]);

  // Back Button Action
  const pressBack = useCallback(() => {
    playSound('back');

    // 1. Close any open modal
    const closeBtn = document.querySelector(
      '.modal-close, .roulette-close-btn, .shortcuts-close-btn, .close-notif-btn'
    );
    if (closeBtn) {
      closeBtn.click();
      showHud('Closed Window', '⮌');
      return;
    }

    // 2. If in Player, handle back
    if (location.pathname.startsWith('/player') || location.pathname.startsWith('/Player')) {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (isFullscreen) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        showHud('Exited Fullscreen', '📺');
      } else {
        navigate('/');
        showHud('Home Screen', '🏠');
      }
      return;
    }

    // 3. Clear search query if active
    const clearSearchBtn = document.querySelector('.search-clear-btn, .clear-search-btn');
    if (clearSearchBtn) {
      clearSearchBtn.click();
      showHud('Search Cleared', '🔍');
      return;
    }

    // 4. Return to Home tab if on another tab
    const homeTabBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('Home'));
    if (homeTabBtn && !homeTabBtn.classList.contains('active')) {
      homeTabBtn.click();
      showHud('Home Screen', '🏠');
      return;
    }

    // 5. On Home base screen
    showHud('Press Home to Refresh or Exit on TV', 'ℹ️');
  }, [location.pathname, navigate, playSound, showHud]);

  // Home Button Action
  const pressHome = useCallback(() => {
    playSound('select');
    navigate('/');
    // Trigger click on Home sidebar item
    setTimeout(() => {
      const homeBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    showHud('Home Screen', '🏠');
  }, [navigate, playSound, showHud]);

  // Color Buttons (Red, Green, Yellow, Blue)
  const pressColor = useCallback((color) => {
    playSound('color');

    if (color === 'red') {
      // Red: Search
      showHud('Red: Quick Search', '🔍');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const input = document.querySelector('.sidebar-search-input');
          if (input) applyFocus(input, 'select');
        }, 300);
      } else {
        const input = document.querySelector('.sidebar-search-input');
        if (input) applyFocus(input, 'select');
      }
    } else if (color === 'green') {
      // Green: My List
      showHud('Green: My Watchlist', '📑');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const myListBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('My List'));
          if (myListBtn) myListBtn.click();
        }, 300);
      } else {
        const myListBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('My List'));
        if (myListBtn) myListBtn.click();
      }
    } else if (color === 'yellow') {
      // Yellow: Live TV
      showHud('Yellow: Live TV Channels', '📺');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const liveBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('Live TV'));
          if (liveBtn) liveBtn.click();
        }, 300);
      } else {
        const liveBtn = Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('Live TV'));
        if (liveBtn) liveBtn.click();
      }
    } else if (color === 'blue') {
      // Blue: Surprise Me Roulette
      showHud('Blue: Surprise Me Roulette', '🎲');
      const surpriseBtn = document.querySelector('.btn-surprise') ||
        Array.from(document.querySelectorAll('.sidebar-nav-item')).find(el => el.textContent.includes('Surprise Me'));
      if (surpriseBtn) {
        surpriseBtn.click();
      }
    }
  }, [location.pathname, navigate, applyFocus, playSound, showHud]);

  // Media Controls: Play/Pause, Rewind, Fast Forward
  const pressMedia = useCallback((action) => {
    playSound('select');

    const video = document.querySelector('video');
    if (action === 'playPause') {
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
          showHud('Playing', '▶️');
        } else {
          video.pause();
          showHud('Paused', '⏸️');
        }
      } else {
        showHud('Play / Pause', '⏯️');
      }
    } else if (action === 'rewind') {
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showHud('Rewind -10s', '⏪');
      } else {
        showHud('Rewind -10s', '⏪');
      }
    } else if (action === 'fastForward') {
      if (video) {
        video.currentTime = Math.min(video.duration || 999999, video.currentTime + 10);
        showHud('Forward +10s', '⏩');
      } else {
        showHud('Forward +10s', '⏩');
      }
    }
  }, [playSound, showHud]);

  // Channel Controls (Up/Down) for Live TV or Fast Page Scroll on Home/Browse
  const pressChannel = useCallback((direction) => {
    playSound('select');
    const isLiveTvActive = document.querySelector('.channel-card, .livetv-container');
    if (isLiveTvActive) {
      const channelCards = Array.from(document.querySelectorAll('.channel-card'));
      if (channelCards.length > 0) {
        const playingIdx = channelCards.findIndex(c => c.classList.contains('playing'));
        let nextIdx = 0;
        if (direction === 'up') {
          nextIdx = playingIdx > 0 ? playingIdx - 1 : channelCards.length - 1;
        } else {
          nextIdx = playingIdx < channelCards.length - 1 ? playingIdx + 1 : 0;
        }
        channelCards[nextIdx].click();
        applyFocus(channelCards[nextIdx], 'select');
        const name = channelCards[nextIdx].querySelector('.card-channel-name')?.textContent || 'Next Channel';
        showHud(`Channel: ${name}`, '📺');
        return;
      }
    }

    // In normal browse mode: 1 click scrolls to next row/section
    scrollPage(direction === 'up' ? 'up' : 'down');
  }, [applyFocus, playSound, showHud, scrollPage]);

  // Volume Controls
  const adjustVolume = useCallback((action) => {
    playSound('nav');
    const video = document.querySelector('video');

    if (action === 'mute') {
      setIsMuted(prev => {
        const next = !prev;
        if (video) video.muted = next;
        showHud(next ? 'Muted' : `Volume ${volume}%`, next ? '🔇' : '🔊');
        return next;
      });
    } else if (action === 'up') {
      setIsMuted(false);
      setVolume(prev => {
        const next = Math.min(100, prev + 5);
        if (video) {
          video.muted = false;
          video.volume = next / 100;
        }
        showHud(`Volume ${next}%`, '🔊');
        return next;
      });
    } else if (action === 'down') {
      setVolume(prev => {
        const next = Math.max(0, prev - 5);
        if (video) {
          video.volume = next / 100;
        }
        showHud(`Volume ${next}%`, '🔉');
        return next;
      });
    }
  }, [volume, playSound, showHud]);

  // Number Button Handlers (0-9)
  const pressNumber = useCallback((num) => {
    playSound('nav');
    showHud(`Key: ${num}`, '🔢');

    // If on Player, numbers 1-5 switch stream server
    if (location.pathname.startsWith('/player') && num >= 1 && num <= 5) {
      const serverButtons = Array.from(document.querySelectorAll('.server-pill, .server-btn'));
      if (serverButtons[num - 1]) {
        serverButtons[num - 1].click();
      }
    }
  }, [location.pathname, playSound, showHud]);

  // Global TV & Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture standard typing if user is actively typing in an input
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive = tag === 'input' || tag === 'textarea';

      const key = e.key;
      const keyCode = e.keyCode || e.which;

      // Smart TV Back button (Samsung Tizen: 10009, LG webOS: 461, Android: 4, Escape)
      if (keyCode === 10009 || keyCode === 461 || keyCode === 4 || key === 'Escape') {
        e.preventDefault();
        pressBack();
        return;
      }

      // Fast Click-to-Scroll: PageDown / PageUp
      if (key === 'PageDown') {
        e.preventDefault();
        scrollPage('down');
        return;
      } else if (key === 'PageUp') {
        e.preventDefault();
        scrollPage('up');
        return;
      }

      // Toggle Virtual Remote simulator with F2 or 'r' (when not typing in search)
      if (key === 'F2' || (key === 'r' && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        // Only if not in Player (in player 'r' is not used, but let's allow F2 always)
        if (key === 'F2') {
          e.preventDefault();
          setIsRemoteOpen(prev => !prev);
          showHud(isRemoteOpen ? 'TV Remote Closed' : 'TV Remote Opened', '🎮');
          return;
        }
      }

      // Directional Arrows
      if (key === 'ArrowUp') {
        e.preventDefault();
        navigateDirection('up');
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        navigateDirection('down');
      } else if (key === 'ArrowLeft') {
        // If typing in input, let normal caret movement work
        if (!isInputActive) {
          e.preventDefault();
          navigateDirection('left');
        }
      } else if (key === 'ArrowRight') {
        if (!isInputActive) {
          e.preventDefault();
          navigateDirection('right');
        }
      }
      // Enter / OK
      else if (key === 'Enter') {
        if (!isInputActive) {
          e.preventDefault();
          pressOk();
        }
      }
      // Color Keys: Red (403), Green (404), Yellow (405), Blue (406)
      else if (keyCode === 403 || key === 'ColorF0Red') {
        e.preventDefault();
        pressColor('red');
      } else if (keyCode === 404 || key === 'ColorF1Green') {
        e.preventDefault();
        pressColor('green');
      } else if (keyCode === 405 || key === 'ColorF2Yellow') {
        e.preventDefault();
        pressColor('yellow');
      } else if (keyCode === 406 || key === 'ColorF3Blue') {
        e.preventDefault();
        pressColor('blue');
      }
      // Media keys
      else if (keyCode === 10252 || key === 'MediaPlayPause') {
        e.preventDefault();
        pressMedia('playPause');
      } else if (keyCode === 415 || key === 'MediaPlay') {
        e.preventDefault();
        pressMedia('playPause');
      } else if (keyCode === 19 || key === 'MediaPause') {
        e.preventDefault();
        pressMedia('playPause');
      } else if (keyCode === 417 || key === 'MediaFastForward') {
        e.preventDefault();
        pressMedia('fastForward');
      } else if (keyCode === 412 || key === 'MediaRewind') {
        e.preventDefault();
        pressMedia('rewind');
      }
      // Channel keys
      else if (keyCode === 427 || key === 'ChannelUp') {
        e.preventDefault();
        pressChannel('up');
      } else if (keyCode === 428 || key === 'ChannelDown') {
        e.preventDefault();
        pressChannel('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateDirection, pressOk, pressBack, pressColor, pressMedia, pressChannel, scrollPage, isRemoteOpen, showHud]);

  return (
    <TvRemoteContext.Provider
      value={{
        isRemoteOpen,
        setIsRemoteOpen,
        soundEnabled,
        setSoundEnabled,
        hudMessage,
        showHud,
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
        adjustVolume,
        applyFocus,
        focusedElement
      }}
    >
      {children}
    </TvRemoteContext.Provider>
  );
};

export const useTvRemote = () => {
  const context = useContext(TvRemoteContext);
  if (!context) {
    throw new Error('useTvRemote must be used within a TvRemoteProvider');
  }
  return context;
};
