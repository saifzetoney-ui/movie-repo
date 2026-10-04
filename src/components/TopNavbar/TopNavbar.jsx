import React, { useState, useEffect, useRef } from 'react';
import './TopNavbar.css';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';

const TopNavbar = ({
  activeTab = 'Home',
  onSelectTab,
  searchQuery = '',
  onSearch,
  myListCount = 0
}) => {
  const { currentProfile, profiles, switchProfile, openCreateProfile, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const tabRefs = useRef([]);
  const animationFrameRef = useRef(null);

  const updateTabMagnification = (pointerX) => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      tabRefs.current.forEach((tab) => {
        if (!tab) return;
        const rect = tab.getBoundingClientRect();
        const distance = pointerX - (rect.left + rect.width / 2);
        const influence = Math.max(0, 1 - Math.abs(distance) / 115);
        const scale = 1 + influence * 0.13;
        tab.style.setProperty('--tab-magnification', scale.toFixed(3));
        tab.style.setProperty('--tab-lift', `${(-influence * 2.5).toFixed(1)}px`);
      });
    });
  };

  const resetTabMagnification = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      tabRefs.current.forEach((tab) => {
        if (!tab) return;
        tab.style.setProperty('--tab-magnification', '1');
        tab.style.setProperty('--tab-lift', '0px');
      });
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    setSearchValue(searchQuery);
    if (searchQuery) {
      setSearchOpen(true);
    }
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (dropdownTimeoutRef.current) {
          clearTimeout(dropdownTimeoutRef.current);
        }
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setProfileDropdownOpen(true);
  };

  const handleProfileMouseLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 400); // 400ms buffer so moving cursor into menu never closes it
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setProfileDropdownOpen((prev) => !prev);
  };

  const handleSearchToggle = () => {
    if (!searchOpen) {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 150);
    } else if (!searchValue) {
      setSearchOpen(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    if (onSearch) onSearch('');
    setSearchOpen(false);
  };

  const navLinks = [
    { id: 'Home', label: 'Home' },
    { id: 'TV Shows', label: 'TV Shows' },
    { id: 'Movies', label: 'Movies' },
    { id: 'Live TV', label: 'Live TV' },
    { id: 'My List', label: 'My List', badge: myListCount }
  ];

  const handleNavClick = (tabId) => {
    if (onSelectTab) onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`top-navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
      {/* Brand logo on left */}
      <div className="navbar-brand-corner" onClick={() => handleNavClick('Home')}>
        <img src={logo} alt="Neplify" className="brand-logo-img" />
        <span className="neplify-brand-logo">NEPLIFY</span>
      </div>

      {/* Floating Center Island as shown in the reference image */}
      <nav className="nav-floating-island">
        {/* 1. Circular Avatar */}
        <div
          className="island-avatar-wrapper"
          ref={dropdownRef}
          onMouseEnter={handleProfileMouseEnter}
          onMouseLeave={handleProfileMouseLeave}
        >
          <button
            type="button"
            className="island-avatar-btn"
            onClick={handleProfileClick}
            aria-label="Profile menu"
          >
            <img
              src={currentProfile?.avatar?.url}
              alt={currentProfile?.name || 'Profile'}
              className="island-avatar-img"
            />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-arrow-top"></div>

              <div className="current-profile-banner">
                <img
                  src={currentProfile?.avatar?.url}
                  alt={currentProfile?.name}
                  className="dropdown-avatar-sm"
                />
                <div className="current-prof-info">
                  <span className="current-prof-name">{currentProfile?.name}</span>
                  <span className="active-tag">Active Profile</span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="other-profiles-section">
                <span className="dropdown-section-title">Switch Profile</span>
                {profiles
                  .filter((p) => p.id !== currentProfile?.id)
                  .map((prof) => (
                    <div
                      key={prof.id}
                      className="profile-switch-row"
                      onClick={() => {
                        switchProfile(prof.id);
                        setProfileDropdownOpen(false);
                      }}
                    >
                      <img
                        src={prof.avatar?.url}
                        alt={prof.name}
                        className="dropdown-avatar-sm"
                      />
                      <span>{prof.name}</span>
                    </div>
                  ))}
              </div>

              <div
                className="dropdown-action-row"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  openCreateProfile();
                }}
              >
                <div className="add-profile-icon">＋</div>
                <span>Create a profile</span>
              </div>

              <div className="dropdown-divider"></div>

              <div
                className="dropdown-action-row"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  openCreateProfile();
                }}
              >
                <span className="menu-icon">⚙️</span>
                <span>Manage Profiles</span>
              </div>

              <div className="dropdown-action-row" onClick={() => setProfileDropdownOpen(false)}>
                <span className="menu-icon">👤</span>
                <span>Account</span>
              </div>

              <div className="dropdown-action-row" onClick={() => setProfileDropdownOpen(false)}>
                <span className="menu-icon">❓</span>
                <span>Help Center</span>
              </div>

              <div className="dropdown-divider"></div>

              <div
                className="dropdown-action-row logout-row"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
              >
                <span>Sign out of Neplify</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Capsule Navigation Pill */}
        <div
          className="island-capsule-nav"
          onPointerMove={(event) => updateTabMagnification(event.clientX)}
          onPointerLeave={resetTabMagnification}
        >
          {navLinks.map((item, index) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                ref={(element) => { tabRefs.current[index] = element; }}
                className={`island-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span>{item.label}</span>
                {item.badge > 0 && <span className="island-tab-badge">{item.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* 3. Circular Search Button & Expanding Search */}
        <div className={`island-search-wrapper ${searchOpen ? 'search-open' : ''}`}>
          <button
            type="button"
            className="island-search-btn"
            onClick={handleSearchToggle}
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {searchOpen && (
            <div className="island-search-drawer">
              <input
                ref={searchInputRef}
                type="text"
                className="island-search-input"
                placeholder="Search titles..."
                value={searchValue}
                onChange={handleSearchInputChange}
              />
              {searchValue && (
                <button
                  type="button"
                  className="island-search-clear"
                  onClick={handleClearSearch}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Hamburger Drawer for small screens */}
      <button
        className="mobile-island-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Mobile navigation"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
          {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <ul className="mobile-nav-list">
            {navLinks.map((item) => (
              <li key={item.id} className="mobile-nav-item">
                <button
                  type="button"
                  className={`mobile-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="nav-badge-count">{item.badge}</span>}
                </button>
              </li>
            ))}
            <li className="mobile-nav-divider"></li>
            <li className="mobile-nav-item">
              <button
                type="button"
                className="mobile-nav-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCreateProfile();
                }}
              >
                <span>➕ Create a Profile</span>
              </button>
            </li>
            <li className="mobile-nav-item">
              <button
                type="button"
                className="mobile-nav-btn signout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <span>Sign out of Neplify</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
