import React, { useEffect, useRef, useState } from 'react';
import './TitleCards.css';
import { referenceMovies } from '../../../data/referenceMovies';
import { Link, useNavigate } from 'react-router-dom';
import CircularCarousel from '../../CircularCarousel/CircularCarousel';

const TitleCards = ({ title = "Movies", category = "popular", mediaType = "movie", onToggleMyList, myListIds = [] }) => {
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const cardsRef = useRef();
  const navigate = useNavigate();

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzU1NmRiNmVkOTVhMDg0YWY5ZDA5OGEzMTQ5Y2Q2YiIsIm5iZiI6MTc2NTEwMjUzNS4zODksInN1YiI6IjY5MzU1M2M3Zjg5OWFjNTE2ZTQ4ZWMwMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H8vCa2R_gzMua9RBuZXkA4Lqe_t7a0vDRcYD_ImwxOs'
    }
  };

  const checkScroll = () => {
    if (!cardsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = cardsRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!cardsRef.current) return;
    const offset = direction === 'left' ? -cardsRef.current.clientWidth * 0.75 : cardsRef.current.clientWidth * 0.75;
    cardsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  useEffect(() => {
    const isMoviesRow = mediaType === 'movie' && (title === 'Movies' || title === 'Blockbuster Movies');
    if (isMoviesRow) return;

    const url = mediaType === "tv"
      ? `https://api.themoviedb.org/3/tv/${category ? category : "popular"}?language=en-US&page=1`
      : `https://api.themoviedb.org/3/movie/${category ? category : "popular"}?language=en-US&page=1`;

    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (res.results && res.results.length > 0) {
          // Filter only items with valid poster_path or backdrop
          const valid = res.results.filter(r => r.poster_path || r.backdrop_path);
          setApiData(valid.length > 0 ? valid : (mediaType === 'movie' ? referenceMovies : []));
        } else {
          setApiData(mediaType === 'movie' ? referenceMovies : []);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.warn(`Unable to load ${mediaType} titles:`, err);
        setApiData(mediaType === 'movie' ? referenceMovies : []);
        setIsLoading(false);
      });

    const el = cardsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [category, mediaType, title]);

  const displayList = apiData.length > 0 ? apiData : referenceMovies;

  if (mediaType === 'movie' && title === 'Movies') {
    const carouselItems = displayList.filter(card => card.poster_path || card.backdrop_path).map((card, index) => ({
      id: card.id || index + 1,
      src: card.poster_path
        ? (card.poster_path.startsWith('http') ? card.poster_path : `https://image.tmdb.org/t/p/w500${card.poster_path}`)
        : (card.backdrop_path.startsWith('http') ? card.backdrop_path : `https://image.tmdb.org/t/p/w500${card.backdrop_path}`),
      title: card.title || card.original_title || card.name || 'Movie',
      alt: card.title || card.original_title || card.name || 'Movie'
    }));
    const featuredMovieIndex = carouselItems.findIndex(item => item.title === 'Jurassic World Rebirth');

    return (
      <div className="title-cards-section title-cards-section--circular">
        <div className="section-header"><h2 className="section-title">{title}</h2></div>
        <CircularCarousel
          items={carouselItems}
          startIndex={featuredMovieIndex >= 0 ? featuredMovieIndex : 0}
          preset="orbit"
          intro="rise"
          autoplay="off"
          cardWidth={214}
          aspectRatio={0.68}
          gap={30}
          parallax={0}
          stretch={0.12}
          depthFade={0.48}
          fadeColor="#090b10"
          cornerRadius={18}
          captions
          onItemClick={(item) => navigate(`/player/${item.id}?type=movie`)}
        />
      </div>
    );
  }

  if (mediaType === 'tv' && title === 'TV Shows') {
    const carouselItems = apiData
      .filter(show => show.poster_path || show.backdrop_path)
      .map(show => ({
        id: show.id,
        src: `https://image.tmdb.org/t/p/w500${show.poster_path || show.backdrop_path}`,
        title: show.name || show.original_name || 'TV Show',
        alt: show.name || show.original_name || 'TV Show',
      }));

    return (
      <div className="title-cards-section title-cards-section--circular">
        <div className="section-header"><h2 className="section-title">{title}</h2></div>
        {carouselItems.length > 0 ? (
          <CircularCarousel
            items={carouselItems}
            preset="orbit"
            intro="rise"
            autoplay="off"
            cardWidth={214}
            aspectRatio={0.68}
            gap={30}
            parallax={0}
            stretch={0.12}
            depthFade={0.48}
            fadeColor="#090b10"
            cornerRadius={18}
            captions
            onItemClick={(item) => navigate(`/player/${item.id}?type=tv`)}
          />
        ) : (
          <div className="circular-carousel-loading" role="status">
            {isLoading ? 'Loading TV shows…' : 'TV shows are temporarily unavailable.'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="title-cards-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>

      <div className="carousel-wrapper">
        <button 
          className={`slider-arrow left-arrow ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => scroll('left')}
          aria-label="Scroll Left"
        >
          <span>&#8249;</span>
        </button>

        <div className="card-list" ref={cardsRef}>
          {displayList.map((card, index) => {
            const movieId = card.id || (index + 1);
            const movieTitle = card.title || card.original_title || card.name;
            const imgSrc = card.poster_path 
              ? (card.poster_path.startsWith('http') ? card.poster_path : `https://image.tmdb.org/t/p/w500${card.poster_path}`)
              : (card.backdrop_path 
                ? `https://image.tmdb.org/t/p/w500${card.backdrop_path}` 
                : (card.image || "https://image.tmdb.org/t/p/w500/39aMkR8Y5vhCG9dTkjiqRl8AVqp.jpg"));
            
            const matchScore = card.vote_average 
              ? `${Math.round(card.vote_average * 10)}% Match` 
              : `${88 + (index * 2) % 11}% Match`;

            const year = (card.release_date || card.first_air_date || '2024').slice(0, 4);
            const isSaved = myListIds.includes(movieId);

            return (
              <div className="poster-card-item" key={card.id || index}>
                <Link 
                  to={`/player/${movieId}?type=${mediaType}`} 
                  className="poster-media-box tv-focusable" 
                  tabIndex={0}
                >
                  <img src={imgSrc} alt={movieTitle} loading="lazy" />

                  {/* Play & Add buttons on hover */}
                  <div className="poster-hover-actions">
                    <div className="poster-play-badge">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>

                    <button
                      type="button"
                      className={`poster-watchlist-btn ${isSaved ? 'in-list' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleMyList && onToggleMyList({ id: movieId, title: movieTitle, image: imgSrc, matchScore, year, mediaType });
                      }}
                      title={isSaved ? "Remove from My List" : "Add to My List"}
                    >
                      {isSaved ? "✓" : "+"}
                    </button>
                  </div>
                </Link>

                {/* Left-aligned title text directly underneath the card matching reference */}
                <h4 className="poster-below-title" title={movieTitle}>
                  {movieTitle}
                </h4>
              </div>
            );
          })}
        </div>

        <button 
          className={`slider-arrow right-arrow ${canScrollRight ? 'visible' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Scroll Right"
        >
          <span>&#8250;</span>
        </button>
      </div>
    </div>
  );
};

export default TitleCards;
