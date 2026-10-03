import React, { useState, useEffect, useRef } from 'react';
import './SurpriseRoulette.css';
import cards_data from '../../assets/cards/Cards_data';

// Curated pool of high-quality titles for reliable, instant roulette picks
const CURATED_TITLES = [
  {
    id: 9502,
    title: "Kung Fu Panda",
    year: "2008",
    rating: "98% Match",
    duration: "1h 32m",
    mediaType: "movie",
    overview: "When Po the panda accidentally gets chosen as the Dragon Warrior, he must believe in himself to defend the Valley of Peace against the ferocious snow leopard Tai Lung.",
    genres: "Animation, Action, Comedy",
    backdrop: "https://image.tmdb.org/t/p/w1280/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    poster: "https://image.tmdb.org/t/p/w500/wWt4JYXTg5Wr3xBW2phBrMKgp3x.jpg"
  },
  {
    id: 93405,
    title: "Squid Game",
    year: "2021",
    rating: "99% Match",
    duration: "S1 E1",
    mediaType: "tv",
    overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.",
    genres: "Thriller, Mystery, Drama",
    backdrop: "https://image.tmdb.org/t/p/w1280/dKQA8scsLqZp12p7iA03G0jC8Y2.jpg",
    poster: "https://image.tmdb.org/t/p/w500/dDlGzmsy0qBwW2p6g4tQz8m7tY3.jpg"
  },
  {
    id: 63174,
    title: "Lucifer",
    year: "2021",
    rating: "97% Match",
    duration: "S1 E1",
    mediaType: "tv",
    overview: "Bored and unhappy as the Lord of Hell, Lucifer Morningstar abandoned his throne and retired to Los Angeles, where he has teamed up with LAPD detective Chloe Decker.",
    genres: "Crime, Sci-Fi & Fantasy",
    backdrop: "https://image.tmdb.org/t/p/w1280/ta5oblHGzbQNsVBEo7r4c0x5sW.jpg",
    poster: "https://image.tmdb.org/t/p/w500/ekZobtgjOp1v57uqjH2eW0e4E2c.jpg"
  },
  {
    id: 71728,
    title: "Young Sheldon",
    year: "2024",
    rating: "96% Match",
    duration: "S1 E1",
    mediaType: "tv",
    overview: "The hilarious and heartwarming early life of child prodigy Sheldon Cooper as he navigates high school at age 9 in East Texas.",
    genres: "Comedy",
    backdrop: "https://image.tmdb.org/t/p/w1280/6UH52Fhu1G6SlzOZf9Y9OHqgI0p.jpg",
    poster: "https://image.tmdb.org/t/p/w500/M7M5C0Y3L54Rj5fK1Zk0N4hXw4.jpg"
  },
  {
    id: 634649,
    title: "Spider-Man: No Way Home",
    year: "2021",
    rating: "98% Match",
    duration: "2h 28m",
    mediaType: "movie",
    overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange, the stakes become even more dangerous.",
    genres: "Action, Adventure, Sci-Fi",
    backdrop: "https://image.tmdb.org/t/p/w1280/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
    poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg"
  },
  {
    id: 155,
    title: "The Dark Knight",
    year: "2008",
    rating: "99% Match",
    duration: "2h 32m",
    mediaType: "movie",
    overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent, until a psychotic mastermind known as the Joker unleashes chaos on Gotham City.",
    genres: "Action, Crime, Drama",
    backdrop: "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1r0YuhqqBi3x.jpg",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
  },
  {
    id: 299534,
    title: "Avengers: Endgame",
    year: "2019",
    rating: "98% Match",
    duration: "3h 01m",
    mediaType: "movie",
    overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos' actions.",
    genres: "Adventure, Sci-Fi, Action",
    backdrop: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
  },
  {
    id: 119051,
    title: "Wednesday",
    year: "2022",
    rating: "97% Match",
    duration: "S1 E1",
    mediaType: "tv",
    overview: "A sleuthing, supernaturally infused mystery charting Wednesday Addams' years as a student at Nevermore Academy.",
    genres: "Sci-Fi & Fantasy, Mystery, Comedy",
    backdrop: "https://image.tmdb.org/t/p/w1280/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
    poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg"
  }
];

const SurpriseRoulette = ({ isOpen, onClose, onWatch, onToggleMyList, myListIds = [] }) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [animIndex, setAnimIndex] = useState(0);
  const spinTimerRef = useRef(null);
  const cycleIntervalRef = useRef(null);

  const startSpin = () => {
    setIsSpinning(true);
    let count = 0;

    // Rapid title cycling animation
    if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
    cycleIntervalRef.current = setInterval(() => {
      setAnimIndex((prev) => (prev + 1) % CURATED_TITLES.length);
      count++;
    }, 70);

    // Stop and lock winner after 1.25 seconds
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      clearInterval(cycleIntervalRef.current);
      const randomIndex = Math.floor(Math.random() * CURATED_TITLES.length);
      setSelectedTitle(CURATED_TITLES[randomIndex]);
      setIsSpinning(false);
    }, 1250);
  };

  useEffect(() => {
    if (isOpen) {
      startSpin();
    } else {
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    }
    return () => {
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDisplay = isSpinning
    ? CURATED_TITLES[animIndex]
    : (selectedTitle || CURATED_TITLES[0]);

  const isSaved = myListIds.includes(currentDisplay.id);

  return (
    <div className="roulette-backdrop" onClick={onClose}>
      <div className="roulette-modal" onClick={(e) => e.stopPropagation()}>
        <button className="roulette-close-btn" onClick={onClose} title="Close (Esc)">
          ✕
        </button>

        {isSpinning ? (
          <div className="roulette-spinning-view">
            <div className="roulette-spinner-ring">
              <span className="roulette-dice-anim">🎲</span>
            </div>
            <h3 className="roulette-spin-title">Finding Your Perfect Match...</h3>
            <p className="roulette-spin-sub">Spinning through top-rated movies & trending shows</p>
            <div className="roulette-preview-box">
              <span className="roulette-cycling-text">{currentDisplay.title}</span>
            </div>
          </div>
        ) : (
          <div className="roulette-winner-view">
            <div className="roulette-banner-wrap">
              <img
                src={currentDisplay.backdrop || currentDisplay.poster}
                alt={currentDisplay.title}
                className="roulette-hero-img"
              />
              <div className="roulette-hero-gradient"></div>
              <div className="roulette-match-badge">
                <span>✨ YOUR SURPRISE PICK</span>
              </div>
            </div>

            <div className="roulette-info-content">
              <div className="roulette-meta-row">
                <span className="match-score">{currentDisplay.rating}</span>
                <span className="roulette-pill">{currentDisplay.year}</span>
                <span className="roulette-pill">{currentDisplay.mediaType === 'tv' ? 'SERIES' : 'MOVIE'}</span>
                <span className="roulette-pill">{currentDisplay.duration}</span>
                <span className="quality-badge">ULTRA HD 4K</span>
              </div>

              <h2 className="roulette-movie-title">{currentDisplay.title}</h2>
              <p className="roulette-overview">{currentDisplay.overview}</p>

              {currentDisplay.genres && (
                <div className="roulette-genres">
                  <span className="genres-label">Genres:</span>
                  <span className="genres-val">{currentDisplay.genres}</span>
                </div>
              )}

              <div className="roulette-actions-row">
                <button
                  type="button"
                  className="btn btn-primary roulette-play-btn"
                  onClick={() => onWatch && onWatch(currentDisplay)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Watch Now</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary roulette-spin-again-btn"
                  onClick={startSpin}
                >
                  <span>🎲 Spin Again</span>
                </button>

                {onToggleMyList && (
                  <button
                    type="button"
                    className={`btn btn-secondary roulette-list-btn ${isSaved ? 'in-list' : ''}`}
                    onClick={() => onToggleMyList(currentDisplay)}
                  >
                    <span>{isSaved ? "✓ In My List" : "+ My List"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurpriseRoulette;
