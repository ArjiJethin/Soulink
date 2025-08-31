import { Link } from "react-router-dom";
import "./comp-styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">MyApp</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </div>
    </nav>
  );
}

export default Navbar;
