// ---------- Navbar.jsx ----------
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiUser, FiSettings, FiMenu } from "react-icons/fi";
import "./comp-styles/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleProfileClick = () => {
    navigate("/preferences");
    setMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo / Brand */}
        <div className="logo" onClick={() => navigate("/dashboard") } style={{cursor: 'pointer'}}>
          <span className="logo-text">Soulink</span>
        </div>

        {/* Navigation Buttons */}
        <div className={`nav-actions ${menuOpen ? "open" : ""}`} ref={menuRef}>
          <button
            type="button"
            className="nav-btn notification-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            <FiBell />
          </button>

          <button
            type="button"
            className="nav-btn profile-btn"
            aria-label="Profile"
            title="Profile"
            onClick={handleProfileClick}
          >
            <FiUser />
          </button>

          <button
            type="button"
            className="nav-btn settings-btn"
            aria-label="Settings"
            title="Settings"
          >
            <FiSettings />
          </button>

          {/* Menu button (used on mobile to reveal the other actions) */}
          <button
            type="button"
            className="nav-btn menu-btn"
            aria-label="Open menu"
            title="Menu"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <FiMenu />
          </button>

          {/* Mobile dropdown panel (simple, accessible) */}
          {menuOpen && (
            <div className="mobile-menu" role="menu">
              <button className="mobile-menu-item" role="menuitem" onClick={() => { /* navigate to notifications */ setMenuOpen(false); }}>
                Notifications
              </button>
              <button className="mobile-menu-item" role="menuitem" onClick={handleProfileClick}>
                Profile
              </button>
              <button className="mobile-menu-item" role="menuitem" onClick={() => { /* navigate to settings */ setMenuOpen(false); }}>
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
