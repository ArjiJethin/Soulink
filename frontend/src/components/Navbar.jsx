import { useNavigate } from "react-router-dom";
import { FiBell, FiUser, FiSettings, FiMenu } from "react-icons/fi";
import "./comp-styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/preferences");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logo / Brand */}
        <div className="logo">
          <span className="logo-text">Soulink</span>
        </div>

        {/* Navigation Buttons */}
        <div className="nav-actions">
          <button className="nav-btn notification-btn">
            <FiBell />
          </button>
          <button
            className="nav-btn profile-btn"
            onClick={handleProfileClick}
          >
            <FiUser />
          </button>
          <button className="nav-btn settings-btn">
            <FiSettings />
          </button>
          <button className="nav-btn menu-btn">
            <FiMenu />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
