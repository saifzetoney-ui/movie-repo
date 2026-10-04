import React, { useState, useEffect } from 'react'
import './Navbar.css'
import logo from '../../assets/logo.png'
import profile_img from '../../assets/profile_img.png'

const Navbar = ({ onSearch, searchQuery = '', onSelectCategory, selectedCategory, activeTab = 'Home', onSelectTab, myListCount = 0, recentlyWatchedCount = 0, onSurpriseMe }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  const navItems = [
    {
      name: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      name: 'Recently Watched',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      name: 'TV Shows',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
      )
    },
    {
      name: 'Movies',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      )
    },
    {
      name: 'Live TV',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2"></circle>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
        </svg>
      )
    },
    {
      name: 'New & Popular',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        </svg>
      )
    },
    {
      name: 'Surprise Me',
      icon: (
        <span style={{ fontSize: '18px', display: 'inline-block' }}>🎲</span>
      ),
      isAction: true,
      onClick: onSurpriseMe
    },
    {
      name: 'My List',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    }
  ];

  const categories = [
    { id: 'all', label: 'All Titles' },
    { id: 'popular', label: 'Trending Now' },
    { id: 'top_rated', label: 'Top Rated' },
    { id: 'upcoming', label: 'Upcoming Releases' },
    { id: 'Action', label: 'Action & Adventure' },
    { id: 'Sci-Fi', label: 'Sci-Fi & Fantasy' },
    { id: 'Comedies', label: 'Comedies' },
    { id: 'Dramas', label: 'Dramas' },
    { id: 'Horror', label: 'Horror & Thrillers' },
    { id: 'Anime', label: 'Anime' },
  ];

  return (
    <aside className={`left-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand & Toggle Header */}
      <div className="sidebar-header">
        <div 
          className="sidebar-brand" 
          onClick={() => { setActiveTab('Home'); onSelectCategory && onSelectCategory('all'); }}
        >
          <img src={logo} alt="Neplify" className="brand-n-img" />
          {!collapsed && <span className="brand-full">EPLIFY</span>}
        </div>
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6"></polyline>
            ) : (
              <polyline points="15 18 9 12 15 6"></polyline>
            )}
          </svg>
        </button>
      </div>

      {/* User Profile Area */}
      <div className="sidebar-profile">
        <div className="profile-avatar-wrap">
          <img src={profile_img} alt="Profile" className="sidebar-avatar" />
          <span className="sidebar-online-dot"></span>
        </div>
        {!collapsed && (
          <div className="sidebar-user-meta">
            <span className="user-name">Saif</span>
            <span className="user-status">Premium Ultra HD</span>
          </div>
        )}
      </div>

      {/* Search Input Box */}
      <div 
        className="sidebar-search" 
        onClick={() => { if (collapsed) setCollapsed(false); }}
        title={collapsed ? "Click to search" : undefined}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="search-svg">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        {!collapsed && (
          <>
            <input
              type="text"
              placeholder="Search movies, series..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="sidebar-search-input"
              autoFocus={searchTerm.length > 0}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSearch();
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>

      {/* Main Navigation Items */}
      <div className="sidebar-section">
        {!collapsed && <span className="sidebar-section-title">MENU</span>}
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li
              key={item.name}
              tabIndex={0}
              role="button"
              className={`sidebar-nav-item ${activeTab === item.name ? 'active' : ''} ${item.isAction ? 'nav-action-item' : ''}`}
              onClick={() => {
                if (item.isAction && item.onClick) {
                  item.onClick();
                  return;
                }
                if (onSelectTab) onSelectTab(item.name);
                if (item.name === 'Home' && onSelectCategory) onSelectCategory('all');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (item.isAction && item.onClick) {
                    item.onClick();
                  } else {
                    if (onSelectTab) onSelectTab(item.name);
                    if (item.name === 'Home' && onSelectCategory) onSelectCategory('all');
                  }
                }
              }}
              title={collapsed ? item.name : undefined}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {!collapsed && <span className="nav-item-text">{item.name}</span>}
              {item.name === 'Live TV' && !collapsed && (
                <span className="live-nav-badge">LIVE</span>
              )}
              {item.name === 'New & Popular' && !collapsed && (
                <span className="hot-badge">HOT</span>
              )}
              {item.name === 'Recently Watched' && recentlyWatchedCount > 0 && !collapsed && (
                <span className="count-badge">{recentlyWatchedCount}</span>
              )}
              {item.name === 'My List' && myListCount > 0 && !collapsed && (
                <span className="count-badge">{myListCount}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Left-Aligned Categories Section */}
      <div className="sidebar-section categories-section">
        {!collapsed && (
          <div 
            className="sidebar-section-title toggleable-title"
            tabIndex={0}
            role="button"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            onKeyDown={(e) => { if (e.key === 'Enter') setCategoriesOpen(!categoriesOpen); }}
          >
            <span>CATEGORIES</span>
            <span className="cat-accordion-icon">{categoriesOpen ? '▾' : '▸'}</span>
          </div>
        )}
        
        {(!collapsed && categoriesOpen) && (
          <ul className="sidebar-category-list">
            {categories.map((cat) => (
              <li
                key={cat.id}
                tabIndex={0}
                role="button"
                className={`sidebar-category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelectCategory && onSelectCategory(cat.id); }}
              >
                <span className="category-bullet">•</span>
                <span className="category-item-text">{cat.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom Footer Area */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-item" title={collapsed ? "Notifications" : undefined}>
          <div className="footer-icon-wrap">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="sidebar-badge">3</span>
          </div>
          {!collapsed && <span className="footer-text">Notifications</span>}
        </div>
      </div>
    </aside>
  )
}

export default Navbar
