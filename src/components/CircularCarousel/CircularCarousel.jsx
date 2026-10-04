import React, { useEffect, useState } from 'react';
import './CircularCarousel.css';

const CircularCarousel = ({ items = [], onItemClick }) => {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [items]);
  if (!items.length) return null;
  const visible = items.slice(0, 10);
  const current = visible[active % visible.length];

  return (
    <div className="circular-carousel" aria-label="Movie carousel">
      <button className="circular-carousel__arrow left" onClick={() => setActive((active - 1 + visible.length) % visible.length)} aria-label="Previous movie">‹</button>
      <div className="circular-carousel__stage">
        {visible.map((item, index) => {
          const offset = ((index - active + visible.length) % visible.length);
          const normalized = offset > visible.length / 2 ? offset - visible.length : offset;
          return (
            <button
              key={`${item.id || item.title}-${index}`}
              className={`circular-carousel__card ${normalized === 0 ? 'active' : ''}`}
              style={{ '--offset': normalized }}
              onClick={() => { setActive(index); onItemClick?.(item, index); }}
            >
              <img src={item.src} alt={item.alt || item.title} />
              <span className="circular-carousel__caption">{item.title}</span>
            </button>
          );
        })}
      </div>
      <button className="circular-carousel__arrow right" onClick={() => setActive((active + 1) % visible.length)} aria-label="Next movie">›</button>
      <div className="circular-carousel__current">{current?.title}</div>
    </div>
  );
};

export default CircularCarousel;
