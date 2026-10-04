import React, { useState, useEffect } from 'react'
import './Home.css'
import TopNavbar from '../../components/TopNavbar/TopNavbar'
import BrowseByProvider from '../../components/Providers/BrowseByProvider'
import ProviderPage from '../ProviderPage/ProviderPage'
import logo from '../../assets/logo.png'
import hero_banner from '../../assets/hero_banner.jpg'
import hero_title from '../../assets/hero_title.png'
import TitleCards from '../../components/Navbar/TitleCards/TitleCards'
import Footer from '../../components/Navbar/Footer/Footer'
import cards_data from '../../assets/cards/Cards_data'
import { Link, useNavigate } from 'react-router-dom'
import LiveTV from '../../components/LiveTV/LiveTV'
import SurpriseRoulette from '../../components/SurpriseRoulette/SurpriseRoulette'
import RatingWidget from '../../components/RatingWidget/RatingWidget'
import { useAuth } from '../../context/AuthContext'

const Home = () => {
  const { selectedProviderId, setSelectedProviderId } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMediaType, setSearchMediaType] = useState('all') // 'all' | 'movie' | 'tv'
  const [showModal, setShowModal] = useState(false)
  const [showRoulette, setShowRoulette] = useState(false)
  const navigate = useNavigate()

  const heroMovie = {
    id: 933260,
    title: "The Protector",
    rating: "98% Match",
    year: "2024",
    duration: "2h 14m",
    maturity: "16+",
    genres: ["Fantasy", "Action & Adventure", "Sci-Fi Dramas"],
    description: "Discovering his ties to a secret ancient order, a young man living in modern Istanbul embarks on an epic quest to save the city from an immortal enemy who threatens humanity."
  }

  const [selectedCategory, setSelectedCategory] = useState('all')

  const [activeTab, setActiveTab] = useState('Home')
  const [myList, setMyList] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_my_list');
      if (saved) return JSON.parse(saved);
      return [
        { id: 2, title: "Squid Game", image: cards_data[1]?.image, matchScore: "99% Match", year: "2024" },
        { id: 6, title: "Lucifer", image: cards_data[5]?.image, matchScore: "96% Match", year: "2023" }
      ];
    } catch {
      return [];
    }
  });

  const toggleMyList = (movie) => {
    setMyList((prev) => {
      const exists = prev.some(item => item.id === movie.id);
      let updated;
      if (exists) {
        updated = prev.filter(item => item.id !== movie.id);
      } else {
        updated = [movie, ...prev];
      }
      try {
        localStorage.setItem('neplify_my_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const myListIds = myList.map(item => item.id);

  const [recentlyWatched, setRecentlyWatched] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_recently_watched');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageOrFocus = () => {
      try {
        const saved = localStorage.getItem('neplify_recently_watched');
        if (saved) setRecentlyWatched(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('focus', handleStorageOrFocus);
    return () => window.removeEventListener('focus', handleStorageOrFocus);
  }, []);

  const removeRecentlyWatched = (idToRemove) => {
    setRecentlyWatched((prev) => {
      const updated = prev.filter(item => String(item.id) !== String(idToRemove));
      try {
        localStorage.setItem('neplify_recently_watched', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentlyWatched = () => {
    setRecentlyWatched([]);
    try {
      localStorage.removeItem('neplify_recently_watched');
    } catch {}
  };

  const categoryChips = [
    { id: 'all', label: 'All Titles' },
    { id: 'popular', label: 'Trending Now' },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'upcoming', label: 'New & Upcoming' },
    { id: 'Action', label: 'Action & Adventure' },
    { id: 'Sci-Fi', label: 'Sci-Fi & Fantasy' },
    { id: 'Comedies', label: 'Comedies' },
  ]

  // Live TMDB Multi-Search + Local Cards for any query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const TMDB_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzU1NmRiNmVkOTVhMDg0YWY5ZDA5OGEzMTQ5Y2Q2YiIsIm5iZiI6MTc2NTEwMjUzNS4zODksInN1YiI6IjY5MzU1M2M3Zjg5OWFjNTE2ZTQ4ZWMwMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H8vCa2R_gzMua9RBuZXkA4Lqe_t7a0vDRcYD_ImwxOs';
      const encodedQuery = encodeURIComponent(trimmed);

      // Fetch page 1 and page 2 in parallel for extensive coverage
      Promise.all([
        fetch(`https://api.themoviedb.org/3/search/multi?query=${encodedQuery}&include_adult=false&language=en-US&page=1`, {
          headers: { accept: 'application/json', Authorization: TMDB_TOKEN }
        }).then(r => r.json()).catch(() => ({ results: [] })),
        fetch(`https://api.themoviedb.org/3/search/multi?query=${encodedQuery}&include_adult=false&language=en-US&page=2`, {
          headers: { accept: 'application/json', Authorization: TMDB_TOKEN }
        }).then(r => r.json()).catch(() => ({ results: [] }))
      ]).then(([p1, p2]) => {
        const combined = [...(p1.results || []), ...(p2.results || [])];
        const mediaItems = combined
          .filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && (item.backdrop_path || item.poster_path))
          .map(item => ({
            id: item.id,
            title: item.title || item.name,
            image: item.backdrop_path 
              ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` 
              : `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            mediaType: item.media_type,
            matchScore: item.vote_average ? `${Math.round(item.vote_average * 10)}% Match` : '96% Match',
            year: (item.release_date || item.first_air_date || '').slice(0, 4) || '2024',
            rating: item.vote_average ? item.vote_average.toFixed(1) : '7.5'
          }));

        // Deduplicate TMDB items
        const seenIds = new Set();
        const uniqueTmdb = mediaItems.filter(item => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        // Search local cards too
        const localMatches = cards_data
          .filter(c => c.name.toLowerCase().includes(trimmed.toLowerCase()))
          .map((c, idx) => ({
            id: 100000 + idx,
            title: c.name,
            image: c.image,
            mediaType: 'movie',
            matchScore: '98% Match',
            year: '2024',
            rating: '8.2'
          }));

        setSearchResults([...localMatches, ...uniqueTmdb]);
        setIsSearching(false);
      }).catch(err => {
        console.warn("TMDB search fallback to local cards:", err);
        const localFallback = cards_data
          .filter(c => c.name.toLowerCase().includes(trimmed.toLowerCase()))
          .map((c, idx) => ({
            id: 100000 + idx,
            title: c.name,
            image: c.image,
            mediaType: 'movie',
            matchScore: '98% Match',
            year: '2024',
            rating: '8.2'
          }));
        setSearchResults(localFallback);
        setIsSearching(false);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedSearchResults = searchResults.filter(item => {
    if (searchMediaType === 'all') return true;
    return item.mediaType === searchMediaType;
  });

  if (selectedProviderId) {
    return (
      <ProviderPage
        providerId={selectedProviderId}
        onBackToHome={() => setSelectedProviderId(null)}
      />
    );
  }

  return (
    <div className="home">
      <TopNavbar 
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          setSelectedProviderId(null);
        }}
        searchQuery={searchQuery}
        onSearch={(query) => setSearchQuery(query)}
        myListCount={myList.length}
      />

      {searchQuery ? (
        <div className="search-results-section">
          <div className="search-header-row">
            <div>
              <h2 className="search-heading">
                Search Results for <span className="query-highlight">"{searchQuery}"</span>
              </h2>
              {!isSearching && (
                <span className="results-count-text">
                  Found {displayedSearchResults.length} {displayedSearchResults.length === 1 ? 'title' : 'titles'}
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="search-filter-pills">
                <button 
                  className={`search-filter-pill ${searchMediaType === 'all' ? 'active' : ''}`}
                  onClick={() => setSearchMediaType('all')}
                >
                  All ({searchResults.length})
                </button>
                <button 
                  className={`search-filter-pill ${searchMediaType === 'movie' ? 'active' : ''}`}
                  onClick={() => setSearchMediaType('movie')}
                >
                  Movies ({searchResults.filter(i => i.mediaType === 'movie').length})
                </button>
                <button 
                  className={`search-filter-pill ${searchMediaType === 'tv' ? 'active' : ''}`}
                  onClick={() => setSearchMediaType('tv')}
                >
                  TV Shows ({searchResults.filter(i => i.mediaType === 'tv').length})
                </button>
              </div>
            )}
          </div>

          {isSearching ? (
            <div className="search-loading-state">
              <div className="search-spinner"></div>
              <p>Searching thousands of titles on Neplify...</p>
            </div>
          ) : displayedSearchResults.length > 0 ? (
            <div className="search-grid">
              {displayedSearchResults.map((movie) => {
                const isInList = myListIds.includes(movie.id);
                return (
                  <div className="search-card" key={movie.id}>
                    <Link to={`/player/${movie.id}?type=${movie.mediaType}`} className="search-media-wrap">
                      <img src={movie.image} alt={movie.title} loading="lazy" />
                      <div className="search-play-overlay">
                        <div className="play-circle">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                      <span className="search-type-badge">
                        {movie.mediaType === 'tv' ? 'TV' : 'MOVIE'}
                      </span>
                    </Link>

                    <div className="search-card-meta">
                      <div className="search-meta-top">
                        <span className="match-tag">{movie.matchScore}</span>
                        <span className="search-year-badge">{movie.year}</span>
                        <button
                          className={`search-watchlist-btn ${isInList ? 'in-list' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleMyList(movie);
                          }}
                          title={isInList ? "Remove from My List" : "Add to My List"}
                        >
                          {isInList ? '✓' : '+'}
                        </button>
                      </div>
                      <h4 className="search-card-title" title={movie.title}>{movie.title}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <p>No results found for "{searchQuery}".</p>
              <span>Try searching for popular movies, TV shows, or click a suggestion below:</span>
              <div className="quick-suggestions">
                {["Squid Game", "Spider-Man", "Stranger Things", "Batman", "Avengers", "Supernatural", "Anime"].map(term => (
                  <button 
                    key={term} 
                    className="suggestion-tag"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'Recently Watched' ? (
        <div className="my-list-section recently-watched-page">
          <div className="my-list-header rw-page-header">
            <div>
              <h2>Recently Watched <span className="list-count-badge">({recentlyWatched.length})</span></h2>
              <p>Pick up right where you left off across all your devices.</p>
            </div>
            {recentlyWatched.length > 0 && (
              <button 
                type="button" 
                className="clear-history-action-btn" 
                onClick={clearRecentlyWatched}
                title="Clear all viewing history"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Clear History</span>
              </button>
            )}
          </div>

          {recentlyWatched.length > 0 ? (
            <div className="my-list-grid">
              {recentlyWatched.map((item) => (
                <div className="my-list-card rw-grid-card" key={`rw-${item.id}-${item.season}-${item.episode}`}>
                  <Link 
                    to={`/player/${item.id}?type=${item.mediaType || 'movie'}${item.season ? `&season=${item.season}` : ''}${item.episode ? `&episode=${item.episode}` : ''}`} 
                    className="my-list-media"
                  >
                    <img src={item.image || item.backdrop || item.poster} alt={item.title} />
                    <div className="play-overlay">
                      <div className="play-circle">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                    </div>
                    {item.duration && (
                      <span className="rw-progress-pill">{item.duration}</span>
                    )}
                  </Link>
                  <div className="my-list-info">
                    <div className="card-meta-row">
                      <span className="match-score">{item.rating || "98% Match"}</span>
                      <span className="age-badge">{item.mediaType === 'tv' ? 'TV' : 'Movie'}</span>
                      <span className="quality-badge">HD</span>
                    </div>
                    <div className="my-list-title-row">
                      <h4 className="card-title">{item.title}</h4>
                      <button 
                        className="remove-btn" 
                        onClick={() => removeRecentlyWatched(item.id)}
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-list-state">
              <div className="empty-list-icon">⏱️</div>
              <h3>No recently watched titles</h3>
              <p>Movies and episodes you start watching will automatically appear here so you can resume them anytime.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('Home')}>
                Browse Movies & TV Shows
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'My List' ? (
        <div className="my-list-section">
          <div className="my-list-header">
            <h2>My List <span className="list-count-badge">({myList.length})</span></h2>
            <p>Movies and TV shows you've saved to watch later.</p>
          </div>

          {myList.length > 0 ? (
            <div className="my-list-grid">
              {myList.map((item) => (
                <div className="my-list-card" key={item.id}>
                  <Link to={`/player/${item.id}?type=${item.mediaType || 'movie'}`} className="my-list-media">
                    <img src={item.image} alt={item.title} />
                    <div className="play-overlay">
                      <div className="play-circle">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                    </div>
                  </Link>
                  <div className="my-list-info">
                    <div className="card-meta-row">
                      <span className="match-score">{item.matchScore || "98% Match"}</span>
                      <span className="age-badge">16+</span>
                      <span className="quality-badge">HD</span>
                    </div>
                    <div className="my-list-title-row">
                      <h4 className="card-title">{item.title}</h4>
                      <button 
                        className="remove-btn" 
                        onClick={() => toggleMyList(item)}
                        title="Remove from list"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-list-state">
              <div className="empty-list-icon">📑</div>
              <h3>Your list is currently empty</h3>
              <p>Explore titles on Neplify and click the "+" button on any movie card to add it to your personal watchlist.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('Home')}>
                Browse Movies & TV Shows
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'Live TV' ? (
        <LiveTV />
      ) : (
        <>
          {/* Hero Banner tailored by activeTab */}
          <div className="hero">
            <img src={hero_banner} alt="The Protector" className="banner-img" />
            <div className="hero-vignette"></div>

            <div className="hero-caption">
              <div className="hero-brand-tag">
                <img src={logo} alt="Neplify" className="hero-brand-logo-img" />
                <span className="series-label">
                  {activeTab === 'TV Shows' ? 'SERIES' : 'ORIGINAL'}
                </span>
              </div>
              <img src={hero_title} alt="The Protector" className="caption-img" />

              <div className="hero-badges">
                <span className="top10-badge">TOP 10</span>
                <span className="ranking-text">
                  {activeTab === 'TV Shows' ? '#1 in TV Shows Today' : '#1 in Movies Today'}
                </span>
                <span className="badge-pill">Ultra HD 4K</span>
                <span className="badge-pill">HDR</span>
                <span className="badge-pill">{heroMovie.maturity}</span>
              </div>

              <p className="hero-desc">{heroMovie.description}</p>

              <div className="hero-btns">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/player/${heroMovie.id}?type=${activeTab === 'TV Shows' ? 'tv' : 'movie'}`)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Play</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(true)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>More Info</span>
                </button>
                <button
                  type="button"
                  className="btn btn-surprise"
                  onClick={() => setShowRoulette(true)}
                  title="Don't know what to watch? Let Neplify pick for you!"
                >
                  <span className="surprise-dice-icon">🎲</span>
                  <span>Surprise Me</span>
                </button>
              </div>
            </div>
          </div>

          {/* Browse by Provider Row directly below the hero */}
          <BrowseByProvider onSelectProvider={(pId) => setSelectedProviderId(pId)} />

          {/* Left-Aligned Category Bar */}
          <div className="left-category-bar">
            <span className="category-bar-title">Browse Category:</span>
            <div className="category-pills-list">
              {categoryChips.map((chip) => (
                <button
                  key={chip.id}
                  className={`category-pill ${selectedCategory === chip.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="more-cards">
            {/* Continue Watching / Recently Watched Carousel Row */}
            {recentlyWatched.length > 0 && selectedCategory === 'all' && (
              <div className="title-cards-section recently-watched-row">
                <div className="section-header">
                  <div className="rw-header-left">
                    <h2 className="section-title">⏱️ Continue Watching</h2>
                    <span className="rw-header-badge">{recentlyWatched.length}</span>
                  </div>
                  <button 
                    type="button" 
                    className="rw-view-all-btn"
                    onClick={() => setActiveTab('Recently Watched')}
                    title="View all recently watched titles"
                  >
                    <span>View All ({recentlyWatched.length})</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>

                <div className="carousel-wrapper">
                  <div className="card-list rw-card-list">
                    {recentlyWatched.map((item) => (
                      <div className="movie-card rw-movie-card" key={`rw-home-${item.id}-${item.season}-${item.episode}`}>
                        <Link 
                          to={`/player/${item.id}?type=${item.mediaType || 'movie'}${item.season ? `&season=${item.season}` : ''}${item.episode ? `&episode=${item.episode}` : ''}`} 
                          className="card-media"
                        >
                          <img src={item.image || item.backdrop || item.poster} alt={item.title} loading="lazy" />
                          <div className="card-gradient"></div>

                          {/* Play overlay on hover */}
                          <div className="card-play-hover">
                            <div className="play-badge-icon">
                              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          </div>

                          {/* Episode/Progress pill */}
                          {item.duration && (
                            <span className="rw-episode-pill">{item.duration}</span>
                          )}

                          <div className="card-bottom-info">
                            <h4 className="card-title">{item.title}</h4>
                            <div className="card-meta-line">
                              <span className="match-score">
                                {item.rating && item.rating.includes('%') ? item.rating : `${item.rating || '98%'} Match`}
                              </span>
                              <span className="age-badge">{item.mediaType === 'tv' ? 'TV' : '16+'}</span>
                              <span className="quality-badge">HD</span>
                              <span className="year-badge">{item.year || '2024'}</span>
                            </div>
                          </div>

                          {/* Emerald Progress Bar at the bottom of the card */}
                          <div className="rw-card-progress-track">
                            <div 
                              className="rw-card-progress-bar"
                              style={{ width: `${item.progress || (item.watchedAt ? ((Math.abs(Number(item.id) || 7) * 23) % 45 + 35) : 65)}%` }}
                            ></div>
                          </div>
                        </Link>

                        {/* Remove from history button */}
                        <button 
                          type="button"
                          className="rw-card-remove-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeRecentlyWatched(item.id);
                          }}
                          title="Remove from history"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'TV Shows' ? (
              <>
                <TitleCards title={"Top Rated Series"} category={"top_rated"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Popular TV Shows"} category={"popular"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Airing Today on Neplify"} category={"airing_today"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Critically Acclaimed TV Shows"} category={"on_the_air"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
              </>
            ) : activeTab === 'Movies' ? (
              <>
                <TitleCards title={"Movies"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Blockbuster Movies"} category={"top_rated"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"In Theaters & Trending"} category={"now_playing"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Only on Neplify Movies"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"Upcoming Movie Releases"} category={"upcoming"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
              </>
            ) : activeTab === 'New & Popular' ? (
              <>
                <TitleCards title={"🔥 Trending This Week"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"✨ Brand New Releases"} category={"now_playing"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"⏳ Coming Soon to Neplify"} category={"upcoming"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                <TitleCards title={"🏆 Top Rated Hits"} category={"top_rated"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
              </>
            ) : (
              <>
                {selectedCategory === 'all' ? (
                  <>
                    <TitleCards title={"Movies"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Top Rated"} category={"top_rated"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Trending Now"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Now Playing"} category={"now_playing"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"TV Shows"} category={"popular"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Blockbuster Movies"} category={"top_rated"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Coming Soon"} category={"upcoming"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Popular on Neplify"} category={"popular"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Recommended for You"} category={"top_rated"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Action & Adventure"} category={"popular"} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                    <TitleCards title={"Sci-Fi & Fantasy"} category={"now_playing"} mediaType="tv" onToggleMyList={toggleMyList} myListIds={myListIds} />
                  </>
                ) : (
                  <TitleCards title={`${selectedCategory} Collection`} category={selectedCategory === 'top_rated' || selectedCategory === 'popular' || selectedCategory === 'upcoming' || selectedCategory === 'now_playing' ? selectedCategory : 'popular'} mediaType="movie" onToggleMyList={toggleMyList} myListIds={myListIds} />
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Interactive Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-hero">
              <img src={hero_banner} alt="The Protector" />
              <div className="modal-hero-gradient"></div>
              <div className="modal-hero-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/player/${heroMovie.id}?type=${activeTab === 'TV Shows' ? 'tv' : 'movie'}`)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Play Movie</span>
                </button>
                <RatingWidget itemId={heroMovie.id} title={heroMovie.title} />
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-left">
                <div className="modal-meta-row">
                  <span className="match-score">{heroMovie.rating}</span>
                  <span className="badge-pill">{heroMovie.year}</span>
                  <span className="badge-pill">{heroMovie.maturity}</span>
                  <span className="badge-pill">{heroMovie.duration}</span>
                  <span className="badge-hd">HD</span>
                </div>
                <p className="modal-description">{heroMovie.description}</p>
              </div>

              <div className="modal-right">
                <div className="meta-item">
                  <span className="meta-label">Genres:</span>
                  <span className="meta-val">{heroMovie.genres.join(', ')}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cast:</span>
                  <span className="meta-val">Çağatay Ulusoy, Ayça Ayşin Turan, Hazar Ergüçlü</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Audio:</span>
                  <span className="meta-val">English - Audio Description, Turkish [Original]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surprise Me Roulette Modal */}
      <SurpriseRoulette
        isOpen={showRoulette}
        onClose={() => setShowRoulette(false)}
        onWatch={(movie) => {
          setShowRoulette(false);
          navigate(`/player/${movie.id}?type=${movie.mediaType || 'movie'}`);
        }}
        onToggleMyList={toggleMyList}
        myListIds={myListIds}
      />

      <Footer />
    </div>
  )
}

export default Home
