import React, { useRef, useState, useEffect } from 'react';
import './BrowseByProvider.css';
import { providersList } from '../../data/providersData';

const ProviderLogoIcon = ({ type }) => {
  switch (type) {
    case 'netflix':
      return (
        <span className="p-brand-text netflix-text">NETFLIX</span>
      );
    case 'prime':
      return (
        <div className="p-brand-wrap prime-wrap">
          <span className="p-brand-text prime-text">prime video</span>
          <div className="prime-smile-curve"></div>
        </div>
      );
    case 'disney':
      return (
        <div className="p-brand-wrap disney-wrap">
          <span className="disney-font">Disney</span>
          <span className="plus-sign">+</span>
        </div>
      );
    case 'apple':
      return (
        <div className="p-brand-wrap apple-wrap">
          <svg viewBox="0 0 170 170" width="22" height="22" fill="currentColor">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.74-11.97-14.09-6.3-9.35-11.23-19.98-14.79-31.91-3.56-11.93-5.34-23.08-5.34-33.45 0-14.39 3.66-26.31 10.98-35.76 7.33-9.45 16.39-14.28 27.2-14.49 4.36 0 9.29 1.15 14.79 3.44 5.51 2.29 9.38 3.54 11.63 3.74 2.07-.2 5.86-1.4 11.37-3.61 5.51-2.21 10.15-3.23 13.91-3.06 10.23.63 18.66 4.38 25.29 11.26-9.17 5.56-13.68 13.43-13.53 23.61.16 9.35 3.84 17.07 11.04 23.16 7.21 6.09 15.7 9.54 25.48 10.35-2.09 6.33-4.59 12.33-7.51 18.01zM119.22 31.84c0-6.73 2.45-13.1 7.35-19.12 4.9-6.02 11.13-9.98 18.68-11.88.58 6.54-1.45 12.92-6.08 19.12-4.63 6.2-11.14 10.16-19.53 11.88-.14-1.3-.42-2.58-.42-3.86z"/>
          </svg>
          <span className="apple-tv-label">tv+</span>
        </div>
      );
    case 'max':
      return (
        <span className="p-brand-text max-text">MAX</span>
      );
    case 'hulu':
      return (
        <span className="p-brand-text hulu-text">hulu</span>
      );
    case 'paramount':
      return (
        <div className="p-brand-wrap paramount-wrap">
          <span className="paramount-star">★</span>
          <span className="p-brand-text paramount-text">Paramount+</span>
        </div>
      );
    case 'crunchyroll':
      return (
        <div className="p-brand-wrap crunchyroll-wrap">
          <span className="crunchy-icon">●</span>
          <span className="p-brand-text crunchy-text">crunchyroll</span>
        </div>
      );
    case 'starz':
      return (
        <div className="p-brand-wrap starz-wrap">
          <span className="starz-star">✦</span>
          <span className="p-brand-text starz-text">STARZ</span>
        </div>
      );
    case 'peacock':
      return (
        <div className="p-brand-wrap peacock-wrap">
          <span className="peacock-fan">🦚</span>
          <span className="p-brand-text peacock-text">peacock</span>
        </div>
      );
    default:
      return <span className="p-brand-text">{type}</span>;
  }
};

const BrowseByProvider = ({ onSelectProvider }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const offset = direction === 'left' ? -rowRef.current.clientWidth * 0.75 : rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  return (
    <div className="browse-by-provider-section">
      <div className="provider-section-header">
        <div className="header-left-title">
          <h3 className="provider-title">Browse by Provider</h3>
          <span className="provider-subtitle">Direct access to leading streaming hubs</span>
        </div>
        <span className="swipe-hint">Scroll to explore &rsaquo;</span>
      </div>

      <div className="provider-carousel-wrapper">
        <button
          className={`provider-arrow left ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          &#8249;
        </button>

        <div className="provider-cards-track" ref={rowRef}>
          {providersList.map((provider) => (
            <div
              key={provider.id}
              className={`provider-card provider-${provider.id}`}
              onClick={() => onSelectProvider && onSelectProvider(provider.id)}
              style={{
                '--brand-accent': provider.accentColor,
                '--brand-glow': provider.glowColor
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectProvider && onSelectProvider(provider.id);
              }}
            >
              <div className="provider-card-inner">
                <div className="provider-logo-display">
                  <ProviderLogoIcon type={provider.logoSvg} />
                </div>
                <div className="provider-card-footer">
                  <span className="provider-name-tag">{provider.name}</span>
                  <span className="provider-explore-arrow">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`provider-arrow right ${canScrollRight ? 'visible' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
};

export default BrowseByProvider;
