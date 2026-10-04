import React, { useEffect } from 'react';
import './NetflixSplashScreen.css';
import { useAuth } from '../../context/AuthContext';

const NetflixSplashScreen = () => {
  const { handleSplashComplete } = useAuth();

  useEffect(() => {
    // Play authentic cinematic synth "Ta-dum" audio via Web Audio API
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();

        const playDrumStrike = (delay, freq, gainLevel, dur) => {
          setTimeout(() => {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + dur);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, ctx.currentTime);

            gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + dur);
          }, delay);
        };

        // Two signature rhythmic hits: "Ta" (first short hit) and "DUM" (deep reverberating bass hit)
        playDrumStrike(100, 95, 0.4, 0.4);
        playDrumStrike(450, 68, 0.7, 1.4);
      }
    } catch {
      // Audio autoplay policy fallback
    }

    // Auto-advance after animation completes (2.4s)
    const timer = setTimeout(() => {
      handleSplashComplete();
    }, 2400);

    return () => clearTimeout(timer);
  }, [handleSplashComplete]);

  return (
    <div className="netflix-splash-container" onClick={handleSplashComplete}>
      <div className="netflix-splash-center">
        {/* Animated Netflix Iconic 'N' Ribbon */}
        <div className="netflix-ribbon-n">
          <div className="ribbon-stem stem-left"></div>
          <div className="ribbon-stem stem-diag"></div>
          <div className="ribbon-stem stem-right"></div>
          <div className="ribbon-glow"></div>
        </div>

        <div className="netflix-wordmark">
          <span>N</span>
          <span>E</span>
          <span>T</span>
          <span>F</span>
          <span>L</span>
          <span>I</span>
          <span>X</span>
        </div>

        <div className="splash-loading-pulse">
          <div className="splash-dot"></div>
          <div className="splash-dot"></div>
          <div className="splash-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default NetflixSplashScreen;
