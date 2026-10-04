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
    <nav className={`top-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-left">
        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Brand Logo */}
        <div className="navbar-brand-logo" onClick={() => handleNavClick('Home')}>
          <span className="neplify-brand-logo">NEPLIFY</span>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links-list">
          {navLinks.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                type="button"
                className={`nav-link-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge-count">{item.badge}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-right">
        {/* Expanding Search Bar */}
        <div className={`nav-search-container ${searchOpen ? 'search-expanded' : ''}`}>
          <button
            type="button"
            className="search-toggle-btn"
            onClick={handleSearchToggle}
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <input
            ref={searchInputRef}
            type="text"
            className="search-input-field"
            placeholder="Titles, people, genres..."
            value={searchValue}
            onChange={handleSearchInputChange}
          />

          {searchValue && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Notifications Icon */}
        <button type="button" className="nav-icon-btn notifications-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-dot"></span>
        </button>

        {/* Profile Avatar and Dropdown Menu */}
        <div
          className="navbar-profile-control"
          ref={dropdownRef}
          onMouseEnter={handleProfileMouseEnter}
          onMouseLeave={handleProfileMouseLeave}
        >
          <button
            type="button"
            className="profile-trigger-btn"
            onClick={handleProfileClick}
            aria-label="Profile menu"
          >
            <img
              src={currentProfile?.avatar?.url}
              alt={currentProfile?.name || 'Profile'}
              className="navbar-avatar-thumbnail"
              style={{ backgroundColor: currentProfile?.avatar?.bgColor || '#E50914' }}
            />
            <span className={`caret-arrow ${profileDropdownOpen ? 'open' : ''}`}>▼</span>
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-arrow-top"></div>

              {/* Current Active Profile Header */}
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

              {/* Other Profiles for quick switching */}
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

              {/* Add Profile action */}
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
      </div>

      {/* Mobile Slide-Down Navigation Menu */}
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
    </nav>
  );
};

export default TopNavbar;
