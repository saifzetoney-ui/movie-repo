import React, { useEffect, useState, useRef } from 'react'
import './Player.css'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import RatingWidget from '../../components/RatingWidget/RatingWidget'
import AutoplayOverlay from '../../components/AutoplayOverlay/AutoplayOverlay'

const localMovieMap = {
  100000: { id: 9502, title: "Kung Fu Panda", type: "movie" },
  100001: { id: 93405, title: "Squid Game", type: "tv" },
  100002: { id: 93405, title: "Squid Challenge", type: "tv" },
  100003: { id: 872906, title: "Jawan", type: "movie" },
  100004: { id: 976307, title: "The Ghost", type: "movie" },
  100005: { id: 63174, title: "Lucifer", type: "tv" },
  100006: { id: 215447, title: "The Railway Men", type: "tv" },
  100007: { id: 71728, title: "Young Sheldon", type: "tv" },
  100008: { id: 80240, title: "Sacred Games", type: "tv" },
  100009: { id: 736732, title: "Adipurush", type: "movie" },
  100010: { id: 1172009, title: "Sukhee", type: "movie" },
  100011: { id: 1058694, title: "Mission Raniganj", type: "movie" },
  100012: { id: 976573, title: "Leo", type: "movie" },
  100013: { id: 99966, title: "All of Us Are Dead", type: "tv" },
  1: { id: 9502, title: "Kung Fu Panda", type: "movie" },
  2: { id: 93405, title: "Squid Game", type: "tv" },
  3: { id: 93405, title: "Squid Challenge", type: "tv" },
  4: { id: 872906, title: "Jawan", type: "movie" },
  5: { id: 976307, title: "The Ghost", type: "movie" },
  6: { id: 63174, title: "Lucifer", type: "tv" },
  7: { id: 215447, title: "The Railway Men", type: "tv" },
  8: { id: 71728, title: "Young Sheldon", type: "tv" },
  9: { id: 80240, title: "Sacred Games", type: "tv" },
  10: { id: 736732, title: "Adipurush", type: "movie" },
  11: { id: 1172009, title: "Sukhee", type: "movie" },
  12: { id: 1058694, title: "Mission Raniganj", type: "movie" },
  13: { id: 976573, title: "Leo", type: "movie" },
  14: { id: 99966, title: "All of Us Are Dead", type: "tv" }
};

const langNames = {
  eng: 'English',
  spa: 'Spanish',
  fre: 'French',
  ger: 'German',
  ita: 'Italian',
  por: 'Portuguese',
  pob: 'Portuguese (BR)',
  ara: 'Arabic',
  tur: 'Turkish',
  rus: 'Russian',
  pol: 'Polish',
  nld: 'Dutch',
  swe: 'Swedish',
  nor: 'Norwegian',
  dan: 'Danish',
  fin: 'Finnish',
  ell: 'Greek',
  heb: 'Hebrew',
  cze: 'Czech',
  hun: 'Hungarian',
  ron: 'Romanian',
  hin: 'Hindi',
  jpn: 'Japanese',
  kor: 'Korean',
  zho: 'Chinese',
  ind: 'Indonesian',
  tha: 'Thai',
  vie: 'Vietnamese',
  ukr: 'Ukrainian'
};

const parseTimeToSeconds = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return Math.max(0, Math.floor(val));
  const str = String(val).trim().toLowerCase();
  
  let totalSecs = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const sMatch = str.match(/(\d+)\s*s/);
  
  if (hMatch || mMatch || sMatch) {
    if (hMatch) totalSecs += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSecs += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSecs += parseInt(sMatch[1], 10);
    return totalSecs;
  }
  
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2 && !parts.some(isNaN)) {
      return parts[0] * 60 + parts[1];
    }
  }
  
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
};

const formatSecondsToTime = (secs) => {
  const s = Math.max(0, Math.floor(secs || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  
  if (hours > 0) {
    return `${hours}h${minutes < 10 ? '0' : ''}${minutes}m${seconds < 10 ? '0' : ''}${seconds}s`;
  }
  return `${minutes}m${seconds < 10 ? '0' : ''}${seconds}s`;
};

const Player = () => {
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');
  const timeQuery = searchParams.get('t') || searchParams.get('time');
  const navigate = useNavigate();

  // Map local id to real TMDB id if applicable
  const activeId = localMovieMap[id] ? localMovieMap[id].id : id;
  const initialTypeHint = localMovieMap[id] ? localMovieMap[id].type : null;

  const [loading, setLoading] = useState(true);
  const [playMode, setPlayMode] = useState('stream');
  // Auto mode prefers the HD/CDN sources first, then falls back through the
  // remaining providers if an embed fails to load.
  const [server, setServer] = useState(1);
  const serverPriority = [2, 5, 1, 3, 4];
  const [season, setSeason] = useState(() => {
    const s = Number(seasonParam);
    return s && !isNaN(s) ? s : 1;
  });
  const [episode, setEpisode] = useState(() => {
    const ep = Number(episodeParam);
    return ep && !isNaN(ep) ? ep : 1;
  });
  const [isTv, setIsTv] = useState(() => typeParam === 'tv' || initialTypeHint === 'tv');
  const [seasonsCount, setSeasonsCount] = useState(1);

  // Position key for persistent storage
  const getPositionKey = (tvMode = isTv, sNum = season, epNum = episode) => {
    return tvMode ? `pos_${activeId}_s${sNum}_e${epNum}` : `pos_${activeId}`;
  };

  // Helper to read saved position
  const getSavedPosition = (tvMode = isTv, sNum = season, epNum = episode) => {
    try {
      const posKey = tvMode ? `pos_${activeId}_s${sNum}_e${epNum}` : `pos_${activeId}`;
      const rawPos = localStorage.getItem('neplify_playback_positions');
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        if (parsed[posKey] && parsed[posKey].seconds > 10) {
          return parsed[posKey];
        }
      }
      const rawRw = localStorage.getItem('neplify_recently_watched');
      if (rawRw) {
        const list = JSON.parse(rawRw);
        const found = list.find(m => String(m.id) === String(activeId) && (!tvMode || (m.season === sNum && m.episode === epNum)));
        if (found) {
          if (found.lastPositionSecs && found.lastPositionSecs > 10) {
            return { seconds: found.lastPositionSecs, formatted: formatSecondsToTime(found.lastPositionSecs) };
          }
          if (found.lastPosition) {
            const secs = parseTimeToSeconds(found.lastPosition);
            if (secs > 10) return { seconds: secs, formatted: found.lastPosition };
          }
        }
      }
    } catch (e) {
      console.warn("Error reading saved playback position:", e);
    }
    return null;
  };

  // Resume states
  const initialSavedPos = getSavedPosition(typeParam === 'tv' || initialTypeHint === 'tv', Number(seasonParam) || 1, Number(episodeParam) || 1);
  const initialTimeQuerySecs = timeQuery ? parseTimeToSeconds(timeQuery) : 0;

  const [activeStartTime, setActiveStartTime] = useState(() => {
    if (initialTimeQuerySecs > 0) return initialTimeQuerySecs;
    return null;
  });

  const [resumeSeconds, setResumeSeconds] = useState(() => {
    if (initialTimeQuerySecs > 0) return initialTimeQuerySecs;
    if (initialSavedPos) return initialSavedPos.seconds;
    return 0;
  });

  const [resumeTime, setResumeTime] = useState(() => {
    if (initialTimeQuerySecs > 0) return formatSecondsToTime(initialTimeQuerySecs);
    if (initialSavedPos) return initialSavedPos.formatted || formatSecondsToTime(initialSavedPos.seconds);
    return null;
  });

  const [showResumeBanner, setShowResumeBanner] = useState(() => {
    if (initialTimeQuerySecs > 10) return true;
    if (initialSavedPos && initialSavedPos.seconds > 10) return true;
    return false;
  });

  const [playbackSeconds, setPlaybackSeconds] = useState(() => {
    if (initialTimeQuerySecs > 0) return initialTimeQuerySecs;
    return 0;
  });

  // OpenSubtitles states
  const [imdbId, setImdbId] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [subLang, setSubLang] = useState(() => {
    try {
      return localStorage.getItem('neplify_sub_lang') || 'ara';
    } catch {
      return 'ara';
    }
  });
  const [subEnabled, setSubEnabled] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);

  // Fullscreen refs & state
  const frameBoxRef = useRef(null);
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Binge Autoplay state
  const [isBingeMode, setIsBingeMode] = useState(true);
  const [showAutoplay, setShowAutoplay] = useState(false);
  const [elapsedWatchSeconds, setElapsedWatchSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedWatchSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update resume prompt when title, season, or episode changes
  useEffect(() => {
    const saved = getSavedPosition(isTv, season, episode);
    if (saved && saved.seconds > 10) {
      setResumeSeconds(saved.seconds);
      setResumeTime(saved.formatted || formatSecondsToTime(saved.seconds));
      setShowResumeBanner(true);
      setPlaybackSeconds(0);
    } else {
      setResumeSeconds(0);
      setResumeTime(null);
      setShowResumeBanner(false);
      setPlaybackSeconds(0);
      setActiveStartTime(null);
    }
  }, [activeId, isTv, season, episode]);

  const handleResume = () => {
    const target = resumeSeconds || (resumeTime ? parseTimeToSeconds(resumeTime) : 0);
    if (target > 0) {
      setActiveStartTime(target);
      setPlaybackSeconds(target);
      showToast(`Resumed playback from ${formatSecondsToTime(target)} ⏱️`);
    }
    setShowResumeBanner(false);
  };

  const handleStartOver = () => {
    setActiveStartTime(null);
    setPlaybackSeconds(0);
    setShowResumeBanner(false);
    try {
      const posKey = getPositionKey(isTv, season, episode);
      const rawPos = localStorage.getItem('neplify_playback_positions');
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        delete parsed[posKey];
        localStorage.setItem('neplify_playback_positions', JSON.stringify(parsed));
      }
      const rawRw = localStorage.getItem('neplify_recently_watched');
      if (rawRw) {
        const list = JSON.parse(rawRw);
        const updated = list.map(item => {
          if (String(item.id) === String(activeId) && (!isTv || (item.season === season && item.episode === episode))) {
            return { ...item, progress: 0, lastPosition: '0m00s', lastPositionSecs: 0 };
          }
          return item;
        });
        localStorage.setItem('neplify_recently_watched', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Error resetting position:", e);
    }
    showToast("Playing from beginning 🎬");
  };

  const handleShareTimestamp = () => {
    const currentSecs = playbackSeconds > 0 ? playbackSeconds : (activeStartTime || 0);
    const currentTs = formatSecondsToTime(currentSecs);
    const shareUrl = `${window.location.origin}${window.location.pathname}?type=${isTv ? 'tv' : 'movie'}${isTv ? `&season=${season}&episode=${episode}` : ''}&t=${currentTs}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast(`Copied timestamp link (${currentTs})! 🔗`))
      .catch(() => showToast("Copied link to clipboard!"));
  };

  // Recommendations state (More Like This)
  const [recommendations, setRecommendations] = useState([]);

  // Toast notification feedback state
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2500);
  };

  // Quality of Life Modals: Shortcuts & Subtitle Styling
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSubStyleModal, setShowSubStyleModal] = useState(false);
  const [subStyle, setSubStyle] = useState(() => {
    try {
      const saved = localStorage.getItem('neplify_sub_style');
      return saved ? JSON.parse(saved) : { size: 'medium', color: 'white', bg: 'shadow' };
    } catch {
      return { size: 'medium', color: 'white', bg: 'shadow' };
    }
  });

  const updateSubStyle = (key, value) => {
    setSubStyle(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('neplify_sub_style', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Lock body scroll during full-window or native fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const target = frameBoxRef.current;
    if (!target) return;

    const hasNativeFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // If currently in fullscreen (either native or full-window fallback), exit
    if (isFullscreen || hasNativeFs) {
      setIsFullscreen(false);
      try {
        if (hasNativeFs) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      } catch (err) {
        console.warn("Exit fullscreen error:", err);
      }
      return;
    }

    // Try entering fullscreen
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (target.mozRequestFullScreen) {
        target.mozRequestFullScreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      } else if (iframeRef.current?.requestFullscreen) {
        await iframeRef.current.requestFullscreen();
      } else {
        // Fallback to window fullscreen
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn("Target requestFullscreen rejected, attempting iframe or window fallback:", err);
      try {
        if (iframeRef.current?.requestFullscreen) {
          await iframeRef.current.requestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } catch {
        // Guaranteed fallback: full-window fixed positioning
        setIsFullscreen(true);
      }
    }
  };

  const [details, setDetails] = useState({
    title: "Now Playing",
    year: "2024",
    rating: "98% Match",
    duration: "2h 10m",
    overview: "Streaming live in Ultra HD 4K via VidSrc.",
    genres: "Action, Drama",
    backdrop: null,
    poster: null
  });

  const [trailerData, setTrailerData] = useState({
    key: "u65jZ8h8m-M",
    name: "Official Trailer"
  });

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzU1NmRiNmVkOTVhMDg0YWY5ZDA5OGEzMTQ5Y2Q2YiIsIm5iZiI6MTc2NTEwMjUzNS4zODksInN1YiI6IjY5MzU1M2M3Zjg5OWFjNTE2ZTQ4ZWMwMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H8vCa2R_gzMua9RBuZXkA4Lqe_t7a0vDRcYD_ImwxOs'
    }
  };

  useEffect(() => {
    setLoading(true);

    const fetchMovieData = () => {
      fetch(`https://api.themoviedb.org/3/movie/${activeId}/external_ids`, options)
        .then(r => r.json())
        .then(ext => {
          if (ext && ext.imdb_id) setImdbId(ext.imdb_id);
        })
        .catch(() => {});

      return fetch(`https://api.themoviedb.org/3/movie/${activeId}?language=en-US`, options)
        .then(res => {
          if (!res.ok) throw new Error("Not a movie");
          return res.json();
        })
        .then(data => {
          setIsTv(false);
          setDetails({
            title: data.title || "Now Playing",
            year: (data.release_date || '').slice(0, 4) || "2024",
            rating: data.vote_average ? `${Math.round(data.vote_average * 10)}% Match` : "97% Match",
            duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : "2h 15m",
            overview: data.overview || "Streaming now on Neplify via SuperEmbed.",
            genres: data.genres?.map(g => g.name).join(', ') || "Action, Drama",
            backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
          });
          return fetch(`https://api.themoviedb.org/3/movie/${activeId}/videos?language=en-US`, options);
        })
        .then(res => res.json())
        .then(videoRes => {
          if (videoRes.results && videoRes.results.length > 0) {
            const trailer = videoRes.results.find(v => v.type === "Trailer") || videoRes.results[0];
            setTrailerData(trailer);
          }
          setLoading(false);
        });
    };

    const fetchTvData = () => {
      fetch(`https://api.themoviedb.org/3/tv/${activeId}/external_ids`, options)
        .then(r => r.json())
        .then(ext => {
          if (ext && ext.imdb_id) setImdbId(ext.imdb_id);
        })
        .catch(() => {});

      return fetch(`https://api.themoviedb.org/3/tv/${activeId}?language=en-US`, options)
        .then(res => {
          if (!res.ok) throw new Error("Not a TV show");
          return res.json();
        })
        .then(data => {
          setIsTv(true);
          setSeasonsCount(data.number_of_seasons || 1);
          setDetails({
            title: data.name || "Now Playing",
            year: (data.first_air_date || '').slice(0, 4) || "2024",
            rating: data.vote_average ? `${Math.round(data.vote_average * 10)}% Match` : "98% Match",
            duration: `${data.number_of_seasons || 1} Season${(data.number_of_seasons || 1) > 1 ? 's' : ''}`,
            overview: data.overview || "Streaming now on Neplify via SuperEmbed.",
            genres: data.genres?.map(g => g.name).join(', ') || "TV Drama, Series",
            backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
          });
          return fetch(`https://api.themoviedb.org/3/tv/${activeId}/videos?language=en-US`, options);
        })
        .then(res => res.json())
        .then(videoRes => {
          if (videoRes.results && videoRes.results.length > 0) {
            const trailer = videoRes.results.find(v => v.type === "Trailer") || videoRes.results[0];
            setTrailerData(trailer);
          }
          setLoading(false);
        });
    };

    const activeType = typeParam || initialTypeHint;

    if (activeType === 'tv') {
      fetchTvData().catch(() => fetchMovieData().catch(() => setLoading(false)));
    } else if (activeType === 'movie') {
      fetchMovieData().catch(() => fetchTvData().catch(() => setLoading(false)));
    } else {
      // Disambiguate by popularity/vote count between TV and movie
      Promise.allSettled([
        fetch(`https://api.themoviedb.org/3/tv/${activeId}?language=en-US`, options).then(r => r.ok ? r.json() : null),
        fetch(`https://api.themoviedb.org/3/movie/${activeId}?language=en-US`, options).then(r => r.ok ? r.json() : null)
      ]).then(([tvRes, movieRes]) => {
        const tvData = tvRes.status === 'fulfilled' ? tvRes.value : null;
        const movieData = movieRes.status === 'fulfilled' ? movieRes.value : null;

        const tvScore = tvData ? (tvData.vote_count || 0) + (tvData.popularity || 0) : -1;
        const movieScore = movieData ? (movieData.vote_count || 0) + (movieData.popularity || 0) : -1;

        if (tvScore > movieScore && tvData) {
          fetchTvData().catch(() => setLoading(false));
        } else if (movieData) {
          fetchMovieData().catch(() => setLoading(false));
        } else if (tvData) {
          fetchTvData().catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(() => {
        fetchTvData().catch(() => fetchMovieData().catch(() => setLoading(false)));
      });
    }
  }, [activeId, typeParam]);

  // Save/Update Recently Watched entry in localStorage
  useEffect(() => {
    if (!details.title || details.title === "Now Playing") return;

    try {
      const stored = localStorage.getItem('neplify_recently_watched');
      const list = stored ? JSON.parse(stored) : [];
      const existing = list.find(m => String(m.id) === String(activeId));

      const item = {
        id: activeId,
        title: details.title,
        year: details.year || '2024',
        rating: details.rating || '98% Match',
        duration: isTv ? `S${season} E${episode}` : details.duration,
        mediaType: isTv ? 'tv' : 'movie',
        season: isTv ? season : null,
        episode: isTv ? episode : null,
        image: details.backdrop || details.poster || null,
        backdrop: details.backdrop,
        poster: details.poster,
        watchedAt: Date.now(),
        progress: existing?.progress || 0,
        lastPosition: existing?.lastPosition || null,
        lastPositionSecs: existing?.lastPositionSecs || 0
      };

      const filtered = list.filter(m => String(m.id) !== String(activeId));
      const updated = [item, ...filtered].slice(0, 25);
      localStorage.setItem('neplify_recently_watched', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to recently watched:", e);
    }
  }, [activeId, details.title, details.backdrop, details.poster, details.year, details.rating, details.duration, isTv, season, episode]);

  // Real-time playback position tracking & persistence (increments every 1s, persists every 5s)
  useEffect(() => {
    if (loading || playMode !== 'stream') return;

    const interval = setInterval(() => {
      setPlaybackSeconds(prev => {
        const next = prev + 1;

        // Persist every 5 seconds once past 5 seconds
        if (next >= 5 && next % 5 === 0) {
          try {
            const posKey = getPositionKey(isTv, season, episode);
            const formatted = formatSecondsToTime(next);

            // 1. Update neplify_playback_positions
            const rawPos = localStorage.getItem('neplify_playback_positions');
            const posMap = rawPos ? JSON.parse(rawPos) : {};
            posMap[posKey] = {
              seconds: next,
              formatted,
              updatedAt: Date.now()
            };
            localStorage.setItem('neplify_playback_positions', JSON.stringify(posMap));

            // 2. Update neplify_recently_watched progress bar & last position
            const rawRw = localStorage.getItem('neplify_recently_watched');
            if (rawRw) {
              const list = JSON.parse(rawRw);
              let estDurationSecs = 5400; // default 1h30m
              if (details.duration) {
                const durMatch = details.duration.match(/(\d+)\s*h\s*(\d+)?\s*m?/);
                if (durMatch) {
                  const h = parseInt(durMatch[1] || '0', 10);
                  const m = parseInt(durMatch[2] || '0', 10);
                  estDurationSecs = h * 3600 + m * 60;
                } else if (details.duration.includes('m')) {
                  const m = parseInt(details.duration, 10);
                  if (!isNaN(m) && m > 0) estDurationSecs = m * 60;
                } else if (isTv) {
                  estDurationSecs = 2700; // 45m per episode
                }
              }
              const calculatedProgress = Math.min(99, Math.max(3, Math.round((next / estDurationSecs) * 100)));

              const updatedList = list.map(item => {
                if (String(item.id) === String(activeId)) {
                  return {
                    ...item,
                    progress: calculatedProgress,
                    lastPosition: formatted,
                    lastPositionSecs: next,
                    watchedAt: Date.now()
                  };
                }
                return item;
              });
              localStorage.setItem('neplify_recently_watched', JSON.stringify(updatedList));
            }
          } catch (e) {
            console.warn("Error persisting playback position:", e);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, playMode, isTv, season, episode, activeId, details.duration]);

  // Fetch OpenSubtitles dynamically when imdbId or TV episode changes
  useEffect(() => {
    if (!imdbId) return;

    setSubsLoading(true);
    const subEndpoint = isTv
      ? `https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${season}:${episode}.json`
      : `https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`;

    fetch(subEndpoint)
      .then(res => res.json())
      .then(data => {
        if (data.subtitles && Array.isArray(data.subtitles)) {
          setSubtitles(data.subtitles);
        } else {
          setSubtitles([]);
        }
        setSubsLoading(false);
      })
      .catch(err => {
        console.warn("OpenSubtitles fetch error:", err);
        setSubtitles([]);
        setSubsLoading(false);
      });
  }, [imdbId, isTv, season, episode]);

  // Compute active subtitle track from OpenSubtitles
  const activeSubtitle = subEnabled && subtitles.length > 0
    ? subtitles.find(s => s.lang === subLang) || (subLang === 'eng' ? subtitles[0] : null)
    : null;

  const subParams = activeSubtitle
    ? `&sub_url=${encodeURIComponent(activeSubtitle.url)}&sub_label=${encodeURIComponent('OpenSubtitles ' + (langNames[activeSubtitle.lang] || activeSubtitle.lang.toUpperCase()))}`
    : '';

  // Extract unique available subtitle language codes
  const availableLangs = Array.from(new Set(subtitles.map(s => s.lang))).filter(Boolean);
  const arabicSubs = subtitles.filter(s => s.lang === 'ara');
  const englishSubs = subtitles.filter(s => s.lang === 'eng');
  const otherLangs = availableLangs.filter(l => l !== 'ara' && l !== 'eng');

  // Fetch TMDB Recommendations (More Like This)
  useEffect(() => {
    if (!activeId) return;

    const endpoint = `https://api.themoviedb.org/3/${isTv ? 'tv' : 'movie'}/${activeId}/recommendations?language=en-US&page=1`;
    fetch(endpoint, options)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          setRecommendations(data.results.filter(r => r.backdrop_path || r.poster_path).slice(0, 16));
        } else {
          return fetch(`https://api.themoviedb.org/3/${isTv ? 'tv' : 'movie'}/${activeId}/similar?language=en-US&page=1`, options)
            .then(r => r.json())
            .then(sim => {
              if (sim.results) {
                setRecommendations(sim.results.filter(r => r.backdrop_path || r.poster_path).slice(0, 16));
              }
            });
        }
      })
      .catch(() => {});
  }, [activeId, isTv]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key.toLowerCase();
      const keyCode = e.keyCode || e.which;

      // Smart TV Remote Back Button (Tizen: 10009, webOS: 461, or Esc / Backspace)
      if (keyCode === 10009 || keyCode === 461) {
        e.preventDefault();
        if (isFullscreen) {
          toggleFullscreen();
          showToast("Exited Fullscreen");
        } else {
          navigate('/');
        }
        return;
      }

      // Fullscreen: 'f'
      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
        showToast(isFullscreen ? "Exited Fullscreen" : "Fullscreen Mode");
      }
      // Escape: Exit Fullscreen or Return to Browse
      else if (key === 'escape') {
        if (isFullscreen) {
          toggleFullscreen();
          showToast("Exited Fullscreen");
        } else {
          navigate('/');
        }
      }
      // Next Episode: 'n'
      else if (key === 'n' && isTv) {
        e.preventDefault();
        setEpisode(prev => {
          const next = prev + 1;
          showToast(`Playing Episode ${next}`);
          return next;
        });
      }
      // Prev Episode: 'p'
      else if (key === 'p' && isTv) {
        e.preventDefault();
        setEpisode(prev => {
          if (prev > 1) {
            const next = prev - 1;
            showToast(`Playing Episode ${next}`);
            return next;
          }
          return 1;
        });
      }
      // Server shortcuts 1-5
      else if (['1', '2', '3', '4', '5'].includes(key)) {
        const sNum = Number(key);
        setServer(sNum);
        const serverNames = {
          1: "VidSrc CDN (Default)",
          2: "VidCore HD",
          3: "SuperEmbed Fast",
          4: "SuperEmbed 2",
          5: "VidLink"
        };
        showToast(`Server ${sNum}: ${serverNames[sNum]}`);
      }
      // Back to Browse: 'b'
      else if (key === 'b') {
        navigate('/');
      }
      // Smart TV Remote Color Buttons:
      else if (keyCode === 403 || key === 'colorf0red') {
        e.preventDefault();
        navigate('/');
        showToast("Home Screen 🏠");
      }
      else if (keyCode === 404 || key === 'colorf1green') {
        e.preventDefault();
        if (isTv) {
          setEpisode(prev => {
            const next = prev + 1;
            showToast(`Next Episode ${next} ⏭️`);
            return next;
          });
        } else {
          showToast("Watchlist Updated ✨");
        }
      }
      else if (keyCode === 405 || key === 'colorf2yellow') {
        e.preventDefault();
        setServer(prev => {
          const next = (prev % 5) + 1;
          const serverNames = {
            1: "VidSrc CDN (Default)",
            2: "VidCore HD",
            3: "SuperEmbed Fast",
            4: "SuperEmbed 2",
            5: "VidLink"
          };
          showToast(`Server ${next}: ${serverNames[next]}`);
          return next;
        });
      }
      else if (keyCode === 406 || key === 'colorf3blue') {
        e.preventDefault();
        setSubEnabled(prev => {
          const next = !prev;
          showToast(next ? "Subtitles: ON 💬" : "Subtitles: OFF 💬");
          return next;
        });
      }
      // Toggle shortcuts cheatsheet: '?'
      else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTv, isFullscreen, navigate]);

  // Stream Sources with activeStartTime timestamp support:
  // Server 1: VidSrc (Fast CDN mirror - Default)
  const vidsrcTimeParam = activeStartTime && activeStartTime > 0 ? `&t=${activeStartTime}#t=${activeStartTime}` : '';
  const vidsrcUrl = isTv
    ? `https://vidsrc.me/embed/tv?tmdb=${activeId}&season=${season}&episode=${episode}${vidsrcTimeParam}`
    : `https://vidsrc.me/embed/movie?tmdb=${activeId}${vidsrcTimeParam}`;

  // Server 2: VidCore HD (Fast Cloudflare CDN with built-in subtitle tracks)
  const vidcoreTimeParam = activeStartTime && activeStartTime > 0 ? `#t=${activeStartTime}` : '';
  const vidcoreUrl = isTv
    ? `https://vidcore.org/embed/tv/${activeId}/${season}/${episode}${vidcoreTimeParam}`
    : `https://vidcore.org/embed/movie/${activeId}${vidcoreTimeParam}`;

  // Server 3: SuperEmbed Fast (Original fast stream, no subtitles)
  const superEmbedTimeParam = activeStartTime && activeStartTime > 0 ? `&time=${activeStartTime}&t=${activeStartTime}` : '';
  const superEmbedUrl = isTv
    ? `https://multiembed.mov/?video_id=${activeId}&tmdb=1&s=${season}&e=${episode}${superEmbedTimeParam}`
    : `https://multiembed.mov/?video_id=${activeId}&tmdb=1${superEmbedTimeParam}`;

  // Server 4: SuperEmbed Server 2 (High-speed backup)
  const superEmbedServer2Url = isTv
    ? `https://multiembed.mov/?video_id=${activeId}&tmdb=1&s=${season}&e=${episode}&server=2${superEmbedTimeParam}`
    : `https://multiembed.mov/?video_id=${activeId}&tmdb=1&server=2${superEmbedTimeParam}`;

  // Server 5: VidLink HD (Vidstack player with CC & native start time param)
  const vidlinkTimeParam = activeStartTime && activeStartTime > 0 ? `&start=${activeStartTime}&autoplay=true` : '';
  const vidlinkUrl = isTv
    ? `https://vidlink.pro/tv/${activeId}/${season}/${episode}?primaryColor=e50914&autoplay=false${vidlinkTimeParam}`
    : `https://vidlink.pro/movie/${activeId}?primaryColor=e50914&autoplay=false${vidlinkTimeParam}`;

  const currentStreamUrl =
    (server === 0 ? 2 : server) === 1 ? vidsrcUrl :
    (server === 0 ? 2 : server) === 2 ? vidcoreUrl :
    (server === 0 ? 2 : server) === 3 ? superEmbedUrl :
    (server === 0 ? 2 : server) === 4 ? superEmbedServer2Url :
    vidlinkUrl;

  const resolvedServer = server === 0 ? serverPriority[0] : server;
  const handleStreamError = () => {
    const currentIndex = serverPriority.indexOf(resolvedServer);
    const nextServer = serverPriority[currentIndex + 1];
    if (server === 0 && nextServer) {
      setServer(nextServer);
      showToast(`Auto switched to ${nextServer === 5 ? 'VidLink' : nextServer === 1 ? 'VidSrc' : nextServer === 3 ? 'SuperEmbed Fast' : 'SuperEmbed 2'}`);
    } else {
      showToast('This server could not load. Choose another source below.');
    }
  };

  const youtubeTimeParam = activeStartTime && activeStartTime > 0 ? `&start=${activeStartTime}` : '';
  const youtubeUrl = `https://www.youtube.com/embed/${trailerData?.key || 'u65jZ8h8m-M'}?autoplay=1&rel=0&modestbranding=1${youtubeTimeParam}`;

  return (
    <div className="player-container">
      {/* Top Navigation & Status Bar */}
      <div className="player-top-bar">
        <Link to="/" className="back-btn" aria-label="Back to Browse">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Browse</span>
        </Link>

        <Link to="/" className="player-branding" title="Return to Browse">
          <span className="player-n">NEPLIFY</span>
          <span className="player-title-preview">{details.title}</span>
        </Link>

        {/* Right Top Actions: Mode Switcher, Subtitles & Fullscreen */}
        <div className="player-top-right">
          {/* OpenSubtitles Language Selector */}
          {playMode === 'stream' && (
            <div className="subtitles-selector-wrap">
              <span className="sub-icon-wrap" title="Subtitles Language (Default: Arabic)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sub-icon">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="9" y1="10" x2="15" y2="10"></line>
                  <line x1="9" y1="14" x2="13" y2="14"></line>
                </svg>
              </span>
              <select
                value={subEnabled ? subLang : 'off'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'off') {
                    setSubEnabled(false);
                  } else {
                    setSubEnabled(true);
                    setSubLang(val);
                    try {
                      localStorage.setItem('neplify_sub_lang', val);
                    } catch {}
                  }
                }}
                className="sub-select"
                title="Select subtitle language"
              >
                <option value="ara">Arabic (العربية) - Default</option>
                <option value="eng">English (Auto)</option>
                <option value="off">Subtitles: Off</option>
                {availableLangs.filter(l => l !== 'ara' && l !== 'eng').map((lang) => {
                  const count = subtitles.filter(s => s.lang === lang).length;
                  const name = langNames[lang] || lang.toUpperCase();
                  return (
                    <option key={lang} value={lang}>
                      {name} ({count})
                    </option>
                  );
                })}
              </select>
              {activeSubtitle && (
                <span className="sub-status-dot" title="OpenSubtitles Active"></span>
              )}
            </div>
          )}

          {/* Subtitle Style Customizer Button */}
          {playMode === 'stream' && (
            <button 
              type="button"
              className="player-tool-btn sub-settings-btn"
              onClick={() => setShowSubStyleModal(prev => !prev)}
              title="Customize Subtitle Font Size & Colors"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Sub Style</span>
            </button>
          )}

          {/* Keyboard Shortcuts Cheatsheet Button */}
          <button 
            type="button"
            className="player-tool-btn shortcuts-btn"
            onClick={() => setShowShortcutsModal(prev => !prev)}
            title="Keyboard Shortcuts Cheatsheet (Press '?')"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
              <line x1="6" y1="8" x2="6.01" y2="8"></line>
              <line x1="10" y1="8" x2="10.01" y2="8"></line>
              <line x1="14" y1="8" x2="14.01" y2="8"></line>
              <line x1="18" y1="8" x2="18.01" y2="8"></line>
              <line x1="6" y1="12" x2="6.01" y2="12"></line>
              <line x1="18" y1="12" x2="18.01" y2="12"></line>
              <line x1="10" y1="16" x2="14" y2="16"></line>
            </svg>
            <span>Shortcuts</span>
          </button>

          {/* Share Timestamp Link Button */}
          <button 
            type="button"
            className="player-tool-btn share-timestamp-btn"
            onClick={handleShareTimestamp}
            title="Share timestamped link with friends"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Share Link</span>
          </button>

          {/* Binge Autoplay Toggle for TV Series */}
          {isTv && (
            <button
              type="button"
              className={`player-tool-btn binge-toggle-btn ${isBingeMode ? 'active' : ''}`}
              onClick={() => {
                setIsBingeMode(prev => {
                  const next = !prev;
                  showToast(next ? "Binge Autoplay: ON ⚡" : "Binge Autoplay: OFF");
                  return next;
                });
              }}
              title="Toggle automatic next episode countdown"
            >
              <span>⚡ Autoplay: {isBingeMode ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <div className="player-mode-switch">
            <button 
              className={`mode-btn ${playMode === 'stream' ? 'active' : ''}`}
              onClick={() => setPlayMode('stream')}
              title="Watch full title via SuperEmbed"
            >
              <span className="live-dot"></span>
              Watch Full Title
            </button>
            <button 
              className={`mode-btn ${playMode === 'trailer' ? 'active' : ''}`}
              onClick={() => setPlayMode('trailer')}
              title="Watch official trailer on YouTube"
            >
              Trailer
            </button>
          </div>

          <button 
            className={`player-fullscreen-btn ${isFullscreen ? 'active' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              )}
            </svg>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Main Video Frame */}
      <div 
        className={`player-frame-box ${isFullscreen ? 'is-fullscreen' : ''}`} 
        ref={frameBoxRef}
      >
        {/* Floating Resume from Last Position Banner */}
        {showResumeBanner && resumeTime && (
          <div className="resume-prompt-banner">
            <span className="resume-prompt-text">
              ⏱️ Resume playback from <strong>{resumeTime}</strong>?
            </span>
            <div className="resume-prompt-btns">
              <button
                type="button"
                className="resume-btn-primary"
                onClick={handleResume}
              >
                Resume
              </button>
              <button
                type="button"
                className="resume-btn-secondary"
                onClick={handleStartOver}
              >
                Start Over
              </button>
              <button
                type="button"
                className="resume-btn-dismiss"
                onClick={() => setShowResumeBanner(false)}
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Autoplay Countdown Overlay (Binge Mode) */}
        <AutoplayOverlay
          show={showAutoplay}
          season={season}
          nextEpisode={episode + 1}
          onPlayNow={() => {
            setShowAutoplay(false);
            setEpisode(prev => prev + 1);
            showToast(`Playing Season ${season} Episode ${episode + 1} ⚡`);
          }}
          onCancel={() => setShowAutoplay(false)}
        />

        {playMode === 'stream' ? (
          <iframe
            key={`stream-${server}-${activeStartTime || 0}-${season}-${episode}`}
            ref={iframeRef}
            src={currentStreamUrl}
            title={`${details.title} - Stream`}
            allowFullScreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            allow="accelerometer *; autoplay *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *; fullscreen *"
            scrolling="no"
            frameBorder="0"
            onError={handleStreamError}
          ></iframe>
        ) : (
          <iframe
            key={`trailer-${trailerData?.key}-${activeStartTime || 0}`}
            ref={iframeRef}
            src={youtubeUrl}
            title={`${details.title} - Official Trailer`}
            allow="accelerometer *; autoplay *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *; fullscreen *"
            allowFullScreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            frameBorder="0"
          ></iframe>
        )}

        {/* Floating Quick Action Overlay: Next Episode for TV & Fullscreen */}
        <div className="player-floating-actions">
          {isTv && playMode === 'stream' && (
            <div className="floating-ep-controls">
              {episode > 1 && (
                <button
                  type="button"
                  className="floating-ep-btn prev"
                  onClick={() => {
                    const prevEp = Math.max(1, episode - 1);
                    setEpisode(prevEp);
                    showToast(`Playing S${season} E${prevEp}`);
                  }}
                  title="Previous Episode (Hotkey: 'P')"
                >
                  ⏮ Prev Ep
                </button>
              )}
              <button
                type="button"
                className="floating-ep-btn next"
                onClick={() => {
                  const nextEp = episode + 1;
                  setEpisode(nextEp);
                  showToast(`Playing S${season} E${nextEp}`);
                }}
                title="Next Episode (Hotkey: 'N')"
              >
                ⏭ Next Episode (E{episode + 1})
              </button>
            </div>
          )}

          <button 
            className="floating-fs-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc or 'F')" : "Fullscreen Mode ('F')"}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* TV Series Episode & Season Controls */}
      {isTv && playMode === 'stream' && (
        <div className="tv-controls-bar">
          <div className="tv-season-select-wrap">
            <label>Season:</label>
            <select 
              value={season} 
              onChange={(e) => {
                setSeason(Number(e.target.value));
                setEpisode(1);
              }}
              className="tv-select"
            >
              {Array.from({ length: Math.min(seasonsCount, 15) }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>Season {s}</option>
              ))}
            </select>
          </div>

          <div className="tv-episodes-list">
            <span className="episodes-label">Episode:</span>
            <div className="episodes-pills">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((ep) => (
                <button
                  key={ep}
                  className={`ep-pill ${episode === ep ? 'active' : ''}`}
                  onClick={() => setEpisode(ep)}
                >
                  {ep}
                </button>
              ))}
              <button 
                className="ep-next-btn"
                onClick={() => setEpisode(prev => prev + 1)}
                title="Next Episode"
              >
                Next Ep &rsaquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Meta & Server Controls Footer */}
      <div className="player-footer-info">
        <div className="info-top-row">
          <div className="player-title-with-rating">
            <div className="player-title-left">
              <h2>{details.title}</h2>
              <div className="info-meta">
                <span className="player-tag match-score-tag">{details.rating}</span>
                <span className="player-tag year-tag">{details.year}</span>
                <span className="player-tag duration-tag">{details.duration}</span>
                <span className="player-tag hd-tag">4K Ultra HD</span>
                {isTv && <span className="player-tag tv-badge">TV SERIES</span>}
                <span className="info-genres">{details.genres}</span>
              </div>
            </div>

            {/* Interactive Rating Widget (Thumbs up, down, love) */}
            <RatingWidget
              itemId={activeId}
              title={details.title}
              onRate={(rate) => {
                if (rate === 'love') showToast("Added to your Top Picks! ❤️");
                else if (rate === 'like') showToast("Rated: I like this 👍");
                else if (rate === 'dislike') showToast("Rated: Not for me 👎");
                else showToast("Rating removed");
              }}
            />
          </div>

        </div>

        <p className="player-synopsis">{details.overview}</p>

        <div className="superembed-notice">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12" stroke="#000" strokeWidth="2"></line>
            <line x1="12" y1="8" x2="12.01" y2="8" stroke="#000" strokeWidth="2"></line>
          </svg>
          <span>
            Streaming on <strong>{
              resolvedServer === 1 ? 'VidSrc CDN' :
              resolvedServer === 2 ? 'VidCore HD (Auto selected)' :
              resolvedServer === 3 ? 'SuperEmbed Fast (Instant Play, No Subs)' :
              resolvedServer === 4 ? 'SuperEmbed 2 Backup' :
              'VidLink Player'
            }</strong>.
            {resolvedServer === 3 || resolvedServer === 4 ? ' Note: SuperEmbed uses third-party raw videohosts without subtitle tracks. For subtitles, use VidSrc or VidCore HD.' : server === 0 ? ' Auto mode prioritizes HD/CDN sources and switches when an embed fails.' : ' If playback buffers, click any server pill above to switch.'}
            {arabicSubs.length > 0 && (
              <> &bull; <a href={arabicSubs[0].url} target="_blank" rel="noopener noreferrer" style={{ color: '#46d369', textDecoration: 'underline' }}>Download Arabic Subtitles ({arabicSubs.length} available)</a></>
            )}
            {englishSubs.length > 0 && (
              <> &bull; <a href={englishSubs[0].url} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'underline' }}>English Subtitles</a></>
            )}
          </span>
        </div>
      </div>

      {/* "More Like This" Recommendations Carousel Row */}
      {recommendations.length > 0 && (
        <div className="player-recommendations-section">
          <div className="section-header">
            <div className="rec-header-title">
              <h2 className="section-title">🎬 More Like This</h2>
              <span className="rec-header-tag">Recommended based on {details.title}</span>
            </div>
            <span className="rec-count-pill">{recommendations.length} titles</span>
          </div>

          <div className="carousel-wrapper">
            <div className="card-list rec-card-list">
              {recommendations.map((rec) => {
                const recTitle = rec.title || rec.name || "Recommended";
                const recImg = rec.backdrop_path 
                  ? `https://image.tmdb.org/t/p/w500${rec.backdrop_path}` 
                  : (rec.poster_path ? `https://image.tmdb.org/t/p/w500${rec.poster_path}` : details.poster);
                const recYear = (rec.release_date || rec.first_air_date || '2024').slice(0, 4);
                const recRating = rec.vote_average ? `${Math.round(rec.vote_average * 10)}% Match` : '96% Match';

                return (
                  <div 
                    key={rec.id} 
                    className="movie-card rec-movie-card"
                    onClick={() => {
                      navigate(`/player/${rec.id}?type=${isTv ? 'tv' : 'movie'}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="card-media">
                      <img src={recImg} alt={recTitle} loading="lazy" />
                      <div className="card-gradient"></div>
                      <div className="card-play-hover">
                        <div className="play-badge-icon">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                      <div className="card-bottom-info">
                        <h4 className="card-title">{recTitle}</h4>
                        <div className="card-meta-line">
                          <span className="match-score">{recRating}</span>
                          <span className="age-badge">{isTv ? 'TV' : '16+'}</span>
                          <span className="quality-badge">HD</span>
                          <span className="year-badge">{recYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Feedback */}
      {toastMsg && (
        <div className="player-toast-notification">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {showShortcutsModal && (
        <div className="player-modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
          <div className="player-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="player-modal-header">
              <div className="player-modal-title">
                <span>⌨️</span>
                <h3>Keyboard Shortcuts</h3>
              </div>
              <button className="player-modal-close" onClick={() => setShowShortcutsModal(false)}>✕</button>
            </div>
            <div className="player-modal-body">
              <div className="shortcuts-grid">
                <div className="shortcut-row">
                  <kbd>F</kbd>
                  <span>Toggle Fullscreen Mode</span>
                </div>
                {isTv && (
                  <>
                    <div className="shortcut-row">
                      <kbd>N</kbd>
                      <span>Next Episode</span>
                    </div>
                    <div className="shortcut-row">
                      <kbd>P</kbd>
                      <span>Previous Episode</span>
                    </div>
                  </>
                )}
                <div className="shortcut-row">
                  <kbd>1 - 5</kbd>
                  <span>Instant Switch Stream Server (VidSrc, VidCore, SuperEmbed...)</span>
                </div>
                <div className="shortcut-row">
                  <kbd>B</kbd>
                  <span>Back to Browse / Home</span>
                </div>
                <div className="shortcut-row">
                  <kbd>?</kbd>
                  <span>Toggle this Shortcuts Menu</span>
                </div>
                <div className="shortcut-row">
                  <kbd>Esc</kbd>
                  <span>Exit Fullscreen / Close Modal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtitle Style Customizer Modal */}
      {showSubStyleModal && (
        <div className="player-modal-backdrop" onClick={() => setShowSubStyleModal(false)}>
          <div className="player-modal-card sub-style-modal" onClick={(e) => e.stopPropagation()}>
            <div className="player-modal-header">
              <div className="player-modal-title">
                <span>⚙️</span>
                <h3>Subtitle Preferences</h3>
              </div>
              <button className="player-modal-close" onClick={() => setShowSubStyleModal(false)}>✕</button>
            </div>
            <div className="player-modal-body">
              {/* Live Preview Box */}
              <div className="sub-preview-box">
                <div 
                  className={`sub-preview-text size-${subStyle.size} color-${subStyle.color} bg-${subStyle.bg}`}
                >
                  {subLang === 'ara' ? 'معاينة الترجمة العربية - Sample Subtitle' : 'Sample Subtitle Caption - Neplify HD'}
                </div>
              </div>

              {/* Size Selector */}
              <div className="sub-pref-group">
                <label>Text Size:</label>
                <div className="sub-pref-buttons">
                  {[
                    { id: 'small', label: 'Small' },
                    { id: 'medium', label: 'Normal' },
                    { id: 'large', label: 'Large' },
                    { id: 'xl', label: 'XL' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`sub-pref-btn ${subStyle.size === s.id ? 'active' : ''}`}
                      onClick={() => updateSubStyle('size', s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="sub-pref-group">
                <label>Text Color:</label>
                <div className="sub-pref-buttons">
                  {[
                    { id: 'white', label: 'White' },
                    { id: 'yellow', label: 'Yellow' },
                    { id: 'cyan', label: 'Cyan' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`sub-pref-btn ${subStyle.color === c.id ? 'active' : ''}`}
                      onClick={() => updateSubStyle('color', c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background / Style Selector */}
              <div className="sub-pref-group">
                <label>Background & Outline:</label>
                <div className="sub-pref-buttons">
                  {[
                    { id: 'shadow', label: 'Shadow Outline' },
                    { id: 'box', label: 'Dark Box' },
                    { id: 'plain', label: 'Plain' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      className={`sub-pref-btn ${subStyle.bg === b.id ? 'active' : ''}`}
                      onClick={() => updateSubStyle('bg', b.id)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sub-modal-footer">
                <button 
                  type="button" 
                  className="sub-save-btn"
                  onClick={() => {
                    setShowSubStyleModal(false);
                    showToast("Subtitle preferences saved");
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Player
