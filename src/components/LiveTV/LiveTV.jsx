import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import './LiveTV.css';
import { CURATED_CHANNELS, PUBLIC_PLAYLISTS } from '../../data/liveTvChannels';

const LiveTV = () => {
  const [selectedChannel, setSelectedChannel] = useState(CURATED_CHANNELS[0]);
  const [streamMode, setStreamMode] = useState(CURATED_CHANNELS[0]?.youtubeId ? 'youtube' : 'hls');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [streamError, setStreamError] = useState(false);
  const [customM3uUrl, setCustomM3uUrl] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [playlistMessage, setPlaylistMessage] = useState('');
  const [activePlaylistName, setActivePlaylistName] = useState('');

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_livetv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loadedM3uChannels, setLoadedM3uChannels] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_livetv_custom_channels');
      const name = localStorage.getItem('neplify_livetv_playlist_name');
      if (name) setActivePlaylistName(name);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerTopRef = useRef(null);

  // Toggle favorite
  const toggleFavorite = (channelId) => {
    setFavorites(prev => {
      const updated = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem('neplify_livetv_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Switch channel
  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setStreamError(false);
    if (channel.youtubeId) {
      setStreamMode('youtube');
    } else {
      setStreamMode('hls');
    }
    if (playerTopRef.current) {
      playerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Setup HLS playback
  useEffect(() => {
    if (streamMode !== 'hls' || !selectedChannel?.streamUrl) return;

    setStreamError(false);
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2
      });
      hlsRef.current = hls;

      hls.loadSource(selectedChannel.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('Autoplay prevented:', e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network Error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media Error, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS Error:', data);
              hls.destroy();
              setStreamError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = selectedChannel.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.warn('Autoplay prevented:', e));
      });
      video.onerror = () => setStreamError(true);
    } else {
      setStreamError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, streamMode]);

  // Parse M3U content
  const parseM3U = (text, sourceName) => {
    const lines = text.split('\n');
    const parsed = [];
    let current = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const namePart = line.split(',')[1] || 'Live Channel';
        const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
        const groupMatch = line.match(/group-title="([^"]+)"/i);
        const countryMatch = line.match(/tvg-country="([^"]+)"/i);

        current = {
          name: namePart.trim(),
          logo: logoMatch ? logoMatch[1].trim() : '',
          category: groupMatch ? groupMatch[1].trim() : sourceName || 'IPTV Stream',
          country: countryMatch ? countryMatch[1].toUpperCase() : '',
          quality: namePart.includes('1080') ? '1080p' : (namePart.includes('720') ? '720p' : 'HD')
        };
      } else if (line.startsWith('http') && current) {
        current.id = 'iptv-' + Math.random().toString(36).substr(2, 9);
        current.streamUrl = line;
        parsed.push(current);
        current = null;
      }
    }
    return parsed;
  };

  // Load public playlist (from iptv-org)
  const handleLoadPublicPlaylist = async (playlist) => {
    setIsLoadingPlaylist(true);
    setPlaylistMessage(`Fetching ${playlist.name}...`);
    try {
      const res = await fetch(playlist.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3U(text, playlist.name);

      if (parsed.length === 0) {
        setPlaylistMessage('No valid streams found in this playlist.');
      } else {
        setLoadedM3uChannels(parsed);
        setActivePlaylistName(playlist.name);
        setActiveCategory('Loaded M3U');
        setPlaylistMessage(`Successfully loaded ${parsed.length} channels from ${playlist.name}!`);
        try {
          localStorage.setItem('neplify_livetv_custom_channels', JSON.stringify(parsed));
          localStorage.setItem('neplify_livetv_playlist_name', playlist.name);
        } catch {}
        if (parsed[0]) {
          handleSelectChannel(parsed[0]);
        }
      }
    } catch (err) {
      console.error('Playlist load error:', err);
      setPlaylistMessage(`Could not load playlist: ${err.message}. Try another playlist or custom URL.`);
    } finally {
      setIsLoadingPlaylist(false);
      setTimeout(() => setPlaylistMessage(''), 5000);
    }
  };

  // Load custom M3U from URL
  const handleLoadCustomM3u = async (e) => {
    e.preventDefault();
    if (!customM3uUrl.trim()) return;

    setIsLoadingPlaylist(true);
    setPlaylistMessage('Loading your custom M3U playlist...');
    try {
      const res = await fetch(customM3uUrl.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3U(text, 'Custom Playlist');

      if (parsed.length === 0) {
        setPlaylistMessage('No channels found. Verify that the URL returns a valid #EXTM3U file.');
      } else {
        setLoadedM3uChannels(parsed);
        setActivePlaylistName('Custom Playlist');
        setActiveCategory('Loaded M3U');
        setPlaylistMessage(`Loaded ${parsed.length} custom channels!`);
        try {
          localStorage.setItem('neplify_livetv_custom_channels', JSON.stringify(parsed));
          localStorage.setItem('neplify_livetv_playlist_name', 'Custom Playlist');
        } catch {}
        if (parsed[0]) {
          handleSelectChannel(parsed[0]);
        }
        setIsCustomOpen(false);
      }
    } catch (err) {
      console.error('Custom M3U fetch error:', err);
      setPlaylistMessage(`Failed to fetch M3U: ${err.message}. Ensure the stream server allows CORS or use one of the 1-click playlists above.`);
    } finally {
      setIsLoadingPlaylist(false);
      setTimeout(() => setPlaylistMessage(''), 7000);
    }
  };

  // Categories list
  const categories = [
    { id: 'All', label: 'All Channels', icon: '📺' },
    { id: 'Featured', label: 'Featured', icon: '⭐' },
    { id: 'Arabic News', label: 'Arabic News', icon: '🇸🇦' },
    { id: 'Dutch TV', label: 'Dutch TV', icon: '🇳🇱' },
    { id: 'World News', label: 'World News', icon: '🌍' },
    { id: 'Sports', label: 'Sports', icon: '⚽' },
    ...(loadedM3uChannels.length > 0 ? [{ id: 'Loaded M3U', label: activePlaylistName || 'Loaded M3U', icon: '🌐', count: loadedM3uChannels.length }] : []),
    { id: 'Favorites', label: 'Favorites', icon: '❤️', count: favorites.length }
  ];

  // Combined channels for filtering
  const allPool = activeCategory === 'Loaded M3U'
    ? loadedM3uChannels
    : [...CURATED_CHANNELS, ...(activeCategory === 'Favorites' ? loadedM3uChannels : [])];

  const filteredChannels = allPool.filter(ch => {
    if (activeCategory === 'Featured') {
      if (!ch.featured) return false;
    } else if (activeCategory === 'Favorites') {
      if (!favorites.includes(ch.id)) return false;
    } else if (activeCategory === 'Loaded M3U') {
      // already pool is loadedM3uChannels
    } else if (activeCategory !== 'All') {
      if (ch.category !== activeCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ch.name?.toLowerCase().includes(q);
      const matchAr = ch.nameAr?.toLowerCase().includes(q);
      const matchNl = ch.nameNl?.toLowerCase().includes(q);
      const matchCat = ch.category?.toLowerCase().includes(q);
      return matchName || matchAr || matchNl || matchCat;
    }

    return true;
  });

  const isCurrentFavorite = favorites.includes(selectedChannel?.id);

  return (
    <div className="livetv-container" ref={playerTopRef}>
      {/* Top Banner / Breadcrumb */}
      <div className="livetv-header">
        <div className="livetv-header-left">
          <div className="livetv-live-badge">
            <span className="livetv-pulse-dot"></span>
            LIVE BROADCASTS
          </div>
          <h1 className="livetv-title">Live TV Channels</h1>
          <p className="livetv-subtitle">
            Free streaming 24/7 channels from the Netherlands, Arab world, World News & Sports.
          </p>
        </div>

        {/* 1-Click IPTV-Org Playlist Quick Loaders */}
        <div className="livetv-header-actions">
          <div className="playlist-quick-bar">
            <span className="quick-bar-label">Instant Playlists:</span>
            {PUBLIC_PLAYLISTS.map(pl => (
              <button
                key={pl.id}
                className="btn-quick-playlist"
                onClick={() => handleLoadPublicPlaylist(pl)}
                disabled={isLoadingPlaylist}
                title={`Load ${pl.count} from ${pl.name}`}
              >
                <span className="pl-flag">{pl.flag}</span>
                <span className="pl-name">{pl.name.split(' ')[0]}</span>
              </button>
            ))}
            <button
              className={`btn-quick-playlist btn-custom ${isCustomOpen ? 'active' : ''}`}
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              title="Load custom M3U playlist link"
            >
              <span>➕ Custom M3U</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom M3U Dropdown Form */}
      {isCustomOpen && (
        <form className="custom-m3u-card animate-fade-in" onSubmit={handleLoadCustomM3u}>
          <div className="custom-m3u-header">
            <h3>Load Custom IPTV M3U Playlist</h3>
            <p>Paste any direct .m3u or .m3u8 playlist URL to import channels into Neplify.</p>
          </div>
          <div className="custom-m3u-input-row">
            <input
              type="url"
              placeholder="https://example.com/playlist.m3u or iptv-org link..."
              value={customM3uUrl}
              onChange={(e) => setCustomM3uUrl(e.target.value)}
              required
              className="custom-m3u-input"
            />
            <button type="submit" className="btn-load-m3u" disabled={isLoadingPlaylist}>
              {isLoadingPlaylist ? 'Importing...' : 'Import Playlist'}
            </button>
          </div>
        </form>
      )}

      {/* Playlist Notification Banner */}
      {playlistMessage && (
        <div className="playlist-notification animate-fade-in">
          <span>ℹ️ {playlistMessage}</span>
          <button className="close-notif-btn" onClick={() => setPlaylistMessage('')}>✕</button>
        </div>
      )}

      {/* Main Cinema Player */}
      {selectedChannel && (
        <div className="livetv-player-wrapper">
          <div className="livetv-screen-container">
            {/* Top Player Info Bar */}
            <div className="player-top-bar">
              <div className="player-channel-identity">
                {selectedChannel.logo ? (
                  <img
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    className="player-channel-logo"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="player-logo-fallback">📺</div>
                )}
                <div className="player-channel-text">
                  <div className="player-title-row">
                    <h2>{selectedChannel.name}</h2>
                    {selectedChannel.nameAr && <span className="arabic-subname">{selectedChannel.nameAr}</span>}
                    <span className="live-pill">● LIVE</span>
                  </div>
                  <div className="player-meta-badges">
                    <span className="meta-tag category-tag">{selectedChannel.category}</span>
                    <span className="meta-tag quality-tag">{selectedChannel.quality || '1080p HD'}</span>
                    {selectedChannel.country && (
                      <span className="meta-tag country-tag">{selectedChannel.country}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Server / Stream Mode Switcher */}
              <div className="player-mode-switch">
                {selectedChannel.streamUrl && (
                  <button
                    className={`mode-btn ${streamMode === 'hls' ? 'active' : ''}`}
                    onClick={() => { setStreamMode('hls'); setStreamError(false); }}
                  >
                    📺 Direct HLS Feed
                  </button>
                )}
                {selectedChannel.youtubeId && (
                  <button
                    className={`mode-btn ${streamMode === 'youtube' ? 'active' : ''}`}
                    onClick={() => { setStreamMode('youtube'); setStreamError(false); }}
                  >
                    ▶️ YouTube 24/7 Live
                  </button>
                )}
                <button
                  className={`fav-toggle-btn ${isCurrentFavorite ? 'is-fav' : ''}`}
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  title={isCurrentFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  {isCurrentFavorite ? '❤️ In Favorites' : '🤍 Add to Favorites'}
                </button>
              </div>
            </div>

            {/* Video Viewport */}
            <div className="video-viewport-box">
              {streamMode === 'youtube' && selectedChannel.youtubeId ? (
                <iframe
                  title={selectedChannel.name}
                  src={`https://www.youtube-nocookie.com/embed/${selectedChannel.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                  className="livetv-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="hls-video-container">
                  <video
                    ref={videoRef}
                    className="livetv-video-player"
                    controls
                    playsInline
                    autoPlay
                  />
                  {streamError && (
                    <div className="stream-error-overlay animate-fade-in">
                      <div className="error-dialog">
                        <div className="error-icon">⚠️</div>
                        <h3>Stream Buffering or Offline</h3>
                        <p>This live stream is temporarily unreachable or blocked by CORS headers.</p>
                        <div className="error-actions">
                          {selectedChannel.youtubeId && (
                            <button
                              className="btn btn-primary"
                              onClick={() => { setStreamMode('youtube'); setStreamError(false); }}
                            >
                              ▶️ Switch to Official YouTube 24/7 Feed
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setStreamError(false);
                              if (videoRef.current && hlsRef.current) {
                                hlsRef.current.loadSource(selectedChannel.streamUrl);
                              }
                            }}
                          >
                            🔄 Reconnect Stream
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description strip */}
            {selectedChannel.description && (
              <div className="channel-description-strip">
                <p>ℹ️ {selectedChannel.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Pills & Channel Filter Bar */}
      <div className="livetv-controls-bar">
        <div className="category-pills-row">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span className="pill-name">{cat.label}</span>
              {cat.count !== undefined && (
                <span className="pill-counter">{cat.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="channel-search-box">
          <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search channel or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      </div>

      {/* Channels Grid */}
      <div className="channel-grid-section">
        <div className="grid-header-row">
          <h2>
            {activeCategory} <span className="channel-count-badge">({filteredChannels.length})</span>
          </h2>
          {activeCategory === 'Loaded M3U' && (
            <button
              className="btn-clear-m3u"
              onClick={() => {
                setLoadedM3uChannels([]);
                setActiveCategory('All');
                try {
                  localStorage.removeItem('neplify_livetv_custom_channels');
                  localStorage.removeItem('neplify_livetv_playlist_name');
                } catch {}
              }}
            >
              Clear Loaded Playlist
            </button>
          )}
        </div>

        {filteredChannels.length > 0 ? (
          <div className="channels-grid">
            {filteredChannels.map(ch => {
              const isSelected = selectedChannel?.id === ch.id;
              const isFav = favorites.includes(ch.id);

              return (
                <div
                  key={ch.id}
                  className={`channel-card ${isSelected ? 'playing' : ''}`}
                  onClick={() => handleSelectChannel(ch)}
                >
                  <div className="card-media-wrapper">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        className="channel-card-logo"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div
                      className="channel-card-logo-fallback"
                      style={{ display: ch.logo ? 'none' : 'flex' }}
                    >
                      📺
                    </div>

                    {/* Playing indicator */}
                    {isSelected && (
                      <div className="playing-wave-overlay">
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <div className="wave-bar"></div>
                        <span className="now-playing-label">PLAYING</span>
                      </div>
                    )}

                    {/* Quality tag */}
                    <span className="card-quality-badge">{ch.quality || 'HD'}</span>
                  </div>

                  <div className="card-info-box">
                    <div className="card-title-row">
                      <h4 className="card-channel-name" title={ch.name}>
                        {ch.name}
                      </h4>
                      <button
                        className={`card-fav-btn ${isFav ? 'is-fav' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(ch.id);
                        }}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>
                    </div>

                    {ch.nameAr && <div className="card-ar-name">{ch.nameAr}</div>}

                    <div className="card-footer-meta">
                      <span className="card-cat-tag">{ch.category}</span>
                      <span className="card-live-dot">● Live</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-channels-state">
            <div className="empty-icon">📡</div>
            <h3>No channels found</h3>
            <p>Try clearing your search query or choosing another category above.</p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTV;
