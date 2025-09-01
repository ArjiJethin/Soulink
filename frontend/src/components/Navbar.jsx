import { Link, useNavigate } from "react-router-dom";
import "./comp-styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/preferences");
  };

  return (
    <nav className="navbar dark-navbar">
      <div className="navbar-container">
        <div className="logo">
          <span className="logo-icon">🔗</span>
          <span className="logo-text">Soul Link</span>
        </div>
        
        <div className="nav-actions">
          <button className="nav-btn notification-btn">
            <span>🔔</span>
          </button>
          <button className="nav-btn profile-btn" onClick={handleProfileClick}>
            <span>👤</span>
          </button>
          <button className="nav-btn settings-btn">
            <span>⚙️</span>
          </button>
          <button className="nav-btn menu-btn">
            <span>☰</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
