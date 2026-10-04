import React, { useEffect, useState, useMemo } from 'react';
import './ProviderPage.css';
import { getProviderById } from '../../data/providersData';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../components/TopNavbar/TopNavbar';
import Footer from '../../components/Navbar/Footer/Footer';

const ProviderPage = ({ providerId = 'prime', onBackToHome }) => {
  const navigate = useNavigate();
  const provider = getProviderById(providerId);

  const [activeCategory, setActiveCategory] = useState('All');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerSections, setProviderSections] = useState(provider.sections || []);
  const [loadedProviderId, setLoadedProviderId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const apiKey = import.meta.env.VITE_TMDB_API_KEY || 'd40cef06bfd32a56fbc548f378ac6e5a';
    const providerIds = provider.tmdbProviderIds;

    const loadType = async (mediaType) => {
      const params = new URLSearchParams({
        api_key: apiKey,
        language: 'en-US',
        page: '1',
        watch_region: 'US',
        with_watch_providers: providerIds,
        sort_by: 'popularity.desc',
        include_adult: 'false'
      });
      const response = await fetch(`https://api.themoviedb.org/3/discover/${mediaType}?${params}`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`TMDB ${mediaType} request failed (${response.status})`);
      const data = await response.json();
      return (data.results || [])
        .filter(item => item.poster_path || item.backdrop_path)
        .map(item => ({
          id: item.id,
          title: item.title || item.name,
          rating: `${Math.round((item.vote_average || 0) * 10)}% Match`,
          year: (item.release_date || item.first_air_date || '').slice(0, 4),
          maturity: '',
          quality: 'HD',
          image: `https://image.tmdb.org/t/p/w500${item.poster_path || item.backdrop_path}`,
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
          badge: mediaType === 'tv' ? 'SERIES' : 'MOVIE',
          mediaType
        }));
    };

    Promise.allSettled([loadType('movie'), loadType('tv')]).then(results => {
      if (controller.signal.aborted) return;
      const [movies, series] = results.map(result => result.status === 'fulfilled' ? result.value : []);
      const nextSections = [];
      if (movies.length) nextSections.push({ title: `Popular Movies on ${provider.name}`, items: movies });
      if (series.length) nextSections.push({ title: `Popular Series on ${provider.name}`, items: series });

      // Keep the curated catalog visible if TMDB is temporarily unavailable.
      setProviderSections(nextSections.length ? nextSections : (provider.sections || []));
      setLoadedProviderId(provider.id);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setProviderSections(provider.sections || []);
        setLoadedProviderId(provider.id);
      }
    });

    return () => controller.abort();
  }, [provider]);

  // Collect all items from provider
  const allProviderItems = useMemo(() => {
    const list = [];
    providerSections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (!list.some((i) => i.id === item.id)) {
          list.push({ ...item, sectionTitle: sec.title });
        }
      });
    });
    return list;
  }, [providerSections]);

  // Filter items based on search and category
  const filteredSections = useMemo(() => {
    return providerSections.map((sec) => {
      const filteredItems = sec.items.filter((item) => {
        const matchesSearch = !providerSearch || item.title.toLowerCase().includes(providerSearch.toLowerCase());
        const matchesCategory =
          activeCategory === 'All' ||
          activeCategory === 'Trending' ||
          (activeCategory === 'Movies' && (item.mediaType || (sec.title.toLowerCase().includes('movie') ? 'movie' : 'tv')) === 'movie') ||
          (activeCategory === 'TV Shows' && (item.mediaType || (sec.title.toLowerCase().includes('movie') ? 'movie' : 'tv')) === 'tv');
        return matchesSearch && matchesCategory;
      });
      return { ...sec, items: filteredItems };
    }).filter((sec) => sec.items.length > 0);
  }, [providerSections, providerSearch, activeCategory]);

  const categories = ['All', 'Movies', 'TV Shows', 'Trending'];

  return (
    <div
      className="provider-page"
      style={{
        '--provider-color': provider.accentColor,
        '--provider-glow': provider.glowColor
      }}
    >
      <TopNavbar
        activeTab="Home"
        onSelectTab={(tab) => {
          if (tab === 'Home' && onBackToHome) {
            onBackToHome();
          }
        }}
      />

      {/* Provider Sub-Header / Breadcrumb */}
      <div className="provider-sub-header">
        <button type="button" className="provider-back-btn" onClick={onBackToHome}>
          <span className="back-arrow-icon">←</span>
          <span>Back to All Streaming Services</span>
        </button>

        <div className="provider-brand-badge">
          <span className="brand-dot"></span>
          <span className="brand-name-display">{provider.name} Hub</span>
        </div>
      </div>

      {/* Hero Section for Provider */}
      <div className="provider-hero">
        <img
          src={provider.bgHero}
          alt={provider.featuredTitle}
          className="provider-hero-img"
        />
        <div className="provider-hero-vignette"></div>

        <div className="provider-hero-content">
          <div className="provider-tagline-pill">
            <span className="hub-label">{provider.name.toUpperCase()} • {allProviderItems.length} TITLES</span>
          </div>

          <h1 className="provider-hero-title">{provider.featuredTitle}</h1>

          <div className="provider-meta-row">
            <span className="provider-match-tag">{provider.rating}</span>
            <span className="provider-badge-pill">{provider.year}</span>
            <span className="provider-badge-pill">{provider.maturity}</span>
            <span className="provider-badge-pill">Ultra HD 4K</span>
            <span className="provider-badge-pill">HDR</span>
          </div>

          <p className="provider-hero-desc">{provider.featuredDesc}</p>

          <div className="provider-hero-actions">
            <button
              type="button"
              className="btn-provider-play"
              onClick={() => {
                const featured = allProviderItems.find(item => item.title?.toLowerCase() === provider.featuredTitle?.toLowerCase()) || allProviderItems[0];
                if (featured) navigate(`/player/${featured.id}?type=${featured.mediaType || 'movie'}`);
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Watch Now with {provider.shortName}</span>
            </button>

            <button
              type="button"
              className="btn-provider-watchlist"
              onClick={() => alert(`Added ${provider.featuredTitle} to your watchlist!`)}
            >
              <span>+ Add to Watchlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Provider Filter Bar & Search */}
      <div className="provider-controls-bar">
        <div className="provider-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`provider-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="provider-search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder={`Search ${provider.name}...`}
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
          />
          {providerSearch && (
            <button
              type="button"
              className="clear-psearch"
              onClick={() => setProviderSearch('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Rows */}
      <div className="provider-rows-container">
        {loadedProviderId !== provider.id && (
          <div className="provider-catalog-status" role="status">Loading {provider.name} titles…</div>
        )}
        {filteredSections.length > 0 ? (
          filteredSections.map((section, idx) => (
            <div key={idx} className="provider-content-row">
              <h2 className="provider-row-title">{section.title}</h2>
              <div className="provider-row-carousel">
                <button
                  type="button"
                  className="provider-row-arrow previous"
                  aria-label={`Scroll ${section.title} left`}
                  onClick={(event) => {
                    const track = event.currentTarget.parentElement.querySelector('.provider-posters-track');
                    track?.scrollBy({ left: -Math.max(track.clientWidth * 0.8, 300), behavior: 'smooth' });
                  }}
                >‹</button>
                <div className="provider-posters-track">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="provider-item-card"
                      onClick={() => navigate(`/player/${item.id}?type=${item.mediaType || 'movie'}`)}
                    >
                      <div className="provider-card-artwork">
                        <img src={item.image} alt={item.title} loading="lazy" />
                        <div className="provider-card-overlay">
                          <div className="p-play-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                        {item.badge && (
                          <span className="provider-item-badge">{item.badge}</span>
                        )}
                      </div>

                      <div className="provider-item-info">
                        <div className="item-meta-top">
                          <span className="p-item-score">{item.rating}</span>
                          <span className="p-item-quality">{item.quality}</span>
                          <span className="p-item-year">{item.year}</span>
                        </div>
                        <h4 className="p-item-title">{item.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="provider-row-arrow next"
                  aria-label={`Scroll ${section.title} right`}
                  onClick={(event) => {
                    const track = event.currentTarget.parentElement.querySelector('.provider-posters-track');
                    track?.scrollBy({ left: Math.max(track.clientWidth * 0.8, 300), behavior: 'smooth' });
                  }}
                >›</button>
              </div>
            </div>
          ))
        ) : (
          <div className="provider-no-results">
            <p>No titles found matching "{providerSearch}" in {provider.name}.</p>
            <button
              type="button"
              className="btn-provider-play"
              onClick={() => {
                setProviderSearch('');
                setActiveCategory('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProviderPage;
