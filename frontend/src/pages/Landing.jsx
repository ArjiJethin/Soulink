import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./page-styles/Landing.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import Drop from "../assets/imgs/logo-nbg.png";
import Cartoon from "../assets/imgs/cartoon.png";
import Droplet from "../assets/imgs/flame.png";

function Landing() {
    const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    navigate("/Preferences");
  };
  const [formType, setFormType] = useState(null); 

  const renderForm = () => {
    if (formType === "signup") {
      return (
        <form className="auth-form">
          <h2>Sign Up</h2>
          <input type="text" placeholder="Name" required />
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit" onClick={handleSignup}>Create Account</button>
          <p>
            Already have an account?{" "}
            <span className="form-switch" onClick={() => setFormType("login")}>
              Log in
            </span>
          </p>
        </form>
      );
    } else if (formType === "login") {
      return (
        <form className="auth-form">
          <h2>Log In</h2>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Log In</button>
          <p>
            Don't have an account?{" "}
            <span className="form-switch" onClick={() => setFormType("signup")}>
              Sign up
            </span>
          </p>
        </form>
      );
    } else {
      return (
        <>
          <img src={Cartoon} alt="Mascot" className="mascot" />
          <h2>Join the Soulink community</h2>

          {/*
          <button className="google-btn">
            <FontAwesomeIcon icon={faGoogle} /> Sign up with Google
          </button>
          */}
          <button
            className="google-btn"
            onClick={() => setFormType("login")}
          >
            <FontAwesomeIcon icon={faUser} /> Log in with Email
          </button>
          <button
            className="email-btn"
            onClick={() => setFormType("signup")}
          >
            <FontAwesomeIcon icon={faUser} /> Sign up with Email
          </button>
        </>
      );
    }
  };

  return (
    <div className="landing">
      <div className="bg-circle bg-blue"></div>
      <div className="bg-circle bg-red"></div>
      <div className="bg-circle bg-yellow"></div>
      <div className="bg-circle bg-green"></div>
      <div className="card">
        <div className="card-left">
          <img src={Drop} alt="Soul Ink Logo" className="logo" />
          <h1 className="app-name">
            Soul
            <span className="i-wrapper">
              i
              <img src={Droplet} alt="Soul Ink Logo" className="drop" />
            </span>
            nk
          </h1>

          <p className="tagline">
            Your personal AI companion for <br /> journaling and mental wellness
          </p>
        </div>
        <div className="card-right">{renderForm()}</div>
      </div>
    </div>
  );
}

export default Landing;