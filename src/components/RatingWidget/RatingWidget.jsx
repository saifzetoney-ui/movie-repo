import React, { useState, useEffect } from 'react';
import './RatingWidget.css';

const RatingWidget = ({ itemId, title = '', onRate, size = 'medium' }) => {
  const [currentRating, setCurrentRating] = useState(null);

  useEffect(() => {
    if (!itemId) return;
    try {
      const stored = localStorage.getItem('neplify_user_ratings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[itemId]) {
          setCurrentRating(parsed[itemId]);
        }
      }
    } catch {}
  }, [itemId]);

  const handleRate = (type) => {
    const nextRating = currentRating === type ? null : type;
    setCurrentRating(nextRating);

    try {
      const stored = localStorage.getItem('neplify_user_ratings');
      const ratings = stored ? JSON.parse(stored) : {};
      if (nextRating) {
        ratings[itemId] = nextRating;
      } else {
        delete ratings[itemId];
      }
      localStorage.setItem('neplify_user_ratings', JSON.stringify(ratings));
    } catch (e) {
      console.warn("Could not save rating:", e);
    }

    if (onRate) {
      onRate(nextRating, type);
    }
  };

  return (
    <div className={`rating-widget rating-widget-${size}`} title="Rate this title">
      <button
        type="button"
        className={`rate-btn rate-dislike ${currentRating === 'dislike' ? 'active' : ''}`}
        onClick={() => handleRate('dislike')}
        title={currentRating === 'dislike' ? "Remove rating" : "Not for me"}
        aria-label="Dislike"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={currentRating === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>
      </button>

      <button
        type="button"
        className={`rate-btn rate-like ${currentRating === 'like' ? 'active' : ''}`}
        onClick={() => handleRate('like')}
        title={currentRating === 'like' ? "Remove rating" : "I like this"}
        aria-label="Like"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={currentRating === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4.33A2.31 2.31 0 0 1 2 20v-7a2.31 2.31 0 0 1 2.33-2H7"></path>
        </svg>
      </button>

      <button
        type="button"
        className={`rate-btn rate-love ${currentRating === 'love' ? 'active' : ''}`}
        onClick={() => handleRate('love')}
        title={currentRating === 'love' ? "Remove rating" : "Love this!"}
        aria-label="Love this"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={currentRating === 'love' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
  );
};

export default RatingWidget;
