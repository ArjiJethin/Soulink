import { Link } from "react-router-dom";
import "./page-styles/Landing.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Drop from "../imgs/logo-nbg.png";
import Cartoon from "../imgs/cartoon.png";

function Landing() {
  return (
    <div className="landing">
      <div className="bg-circle bg-blue"></div>
      <div className="bg-circle bg-red"></div>
      <div className="bg-circle bg-yellow"></div>
      <div className="bg-circle bg-green"></div>
      <div className="card">
        <div className="card-left">
          <img src={Drop} alt="Soul Ink Logo" className="logo" />
          <h1 className="app-name">Soulink</h1>
          <p className="tagline">
            Your personal AI companion for <br /> journaling and mental wellness
          </p>
        </div>

        <div className="card-right">
          <img src={Cartoon} alt="Mascot" className="mascot" />
          <h2>Join the Soulink community</h2>

          <button className="google-btn">
            <FontAwesomeIcon icon={faGoogle} /> Sign up with Google
          </button>
          <button className="email-btn">
            <FontAwesomeIcon icon={faUser} /> Sign up with Email
          </button>
          <p className="login-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
