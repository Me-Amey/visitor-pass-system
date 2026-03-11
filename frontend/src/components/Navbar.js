import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['super_admin', 'org_admin', 'security', 'employee', 'visitor'] },
    { path: '/visitors', label: 'Visitors', icon: '👥', roles: ['super_admin', 'org_admin', 'security', 'employee'] },
    { path: '/appointments', label: 'Appointments', icon: '📅', roles: ['super_admin', 'org_admin', 'security', 'employee'] },
    { path: '/passes', label: 'Passes', icon: '🎫', roles: ['super_admin', 'org_admin', 'security', 'employee'] },
    { path: '/checkinout', label: 'Check In/Out', icon: '✓', roles: ['super_admin', 'org_admin', 'security'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['super_admin', 'org_admin', 'security'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <div className="icon-badge"></div>
          </div>
          <span className="brand-text">Visitor Pass</span>
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
