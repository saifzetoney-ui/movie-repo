import React, { useEffect, useRef, useState } from 'react'
import './TitleCards.css'
import cards_data from '../../../assets/cards/Cards_data'
import { Link } from 'react-router-dom'

const TitleCards = ({ title, category, mediaType = "movie", onToggleMyList, myListIds = [] }) => {
  const [apiData, setApiData] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const cardsRef = useRef();

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
    const url = mediaType === "tv"
      ? `https://api.themoviedb.org/3/tv/${category ? category : "popular"}?language=en-US&page=1`
      : `https://api.themoviedb.org/3/movie/${category ? category : "now_playing"}?language=en-US&page=1`;

    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (res.results && res.results.length > 0) {
          setApiData(res.results);
        } else {
          setApiData(cards_data);
        }
      })
      .catch(err => {
        console.warn("Using fallback cards data due to API error:", err);
        setApiData(cards_data);
      });

    const el = cardsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [category, mediaType]);

  const displayList = apiData.length > 0 ? apiData : cards_data;

  return (
    <div className="title-cards-section">
      <div className="section-header">
        <h2 className="section-title">{title ? title : "Popular on Neplify"}</h2>
        <span className="explore-all">Explore All &rsaquo;</span>
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
            const imgSrc = card.backdrop_path 
              ? `https://image.tmdb.org/t/p/w500${card.backdrop_path}` 
              : (card.poster_path ? `https://image.tmdb.org/t/p/w500${card.poster_path}` : card.image);
            
            const matchScore = card.vote_average 
              ? `${Math.round(card.vote_average * 10)}% Match` 
              : `${88 + (index * 2) % 11}% Match`;

            const year = (card.release_date || card.first_air_date || '2024').slice(0, 4);
            const isSaved = myListIds.includes(movieId);

            return (
              <Link 
                to={`/player/${movieId}?type=${mediaType}`} 
                className="movie-card tv-focusable" 
                tabIndex={0}
                onFocus={(e) => {
                  if (cardsRef.current) {
                    const card = e.currentTarget;
                    const container = cardsRef.current;
                    const offset = (card.offsetLeft + card.offsetWidth / 2) - (container.clientWidth / 2);
                    container.scrollTo({ left: offset, behavior: 'smooth' });
                  }
                }}
                key={card.id || index}
              >
                <div className="card-media">
                  <img src={imgSrc} alt={movieTitle} loading="lazy" />
                  <div className="card-gradient"></div>

                  {/* Clean bottom info directly over the artwork */}
                  <div className="card-bottom-info">
                    <h4 className="card-title">{movieTitle}</h4>
                    <div className="card-meta-line">
                      <span className="match-score">{matchScore}</span>
                      <span className="age-badge">16+</span>
                      <span className="quality-badge">HD</span>
                      <span className="year-badge">{year}</span>
                    </div>
                  </div>

                  {/* Interactive Play & Add buttons on hover */}
                  <div className="card-hover-layer">
                    <div className="play-circle">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>

                    <button
                      type="button"
                      className={`card-add-btn ${isSaved ? 'in-list' : ''}`}
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
                </div>
              </Link>
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
  )
}

export default TitleCards
