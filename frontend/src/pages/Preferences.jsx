import { useState } from "react";
import "./page-styles/Preferences.css";

export default function Preferences() {
  const [diaryOption, setDiaryOption] = useState("Diary");

  return (
    <div className="landing">
      <div className="bg-circle bg-blue"></div>
      <div className="bg-circle bg-red"></div>
      <div className="bg-circle bg-yellow"></div>
      <div className="bg-circle bg-green"></div>

      <div className="auth-form">
        <h2>Preferences</h2>
        <p className="subtitle">
          Customize your profile by choosing the preferences that best suit you
        </p>

        <div className="input-group">
          <label htmlFor="username" className="input-label">
            Username
          </label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
          />
        </div>

        <div className="input-group">
          <label htmlFor="interests" className="input-label">
            Interests
          </label>
          <input
            type="text"
            id="interests"
            placeholder="Enter your interests"
          />
        </div>

        <div className="section">
          <p className="section-title">Diary Type:</p>
          <div className="toggle-buttons">
            <button
              className={`toggle-btn ${diaryOption === "Diary" ? "active" : ""}`}
              onClick={() => setDiaryOption("Diary")}
            >
              Diary
            </button>
            <button
              className={`toggle-btn ${diaryOption === "Questionnaire" ? "active" : ""}`}
              onClick={() => setDiaryOption("Questionnaire")}
            >
              Questionnaire
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="characters" className="input-label">
            Important real life characters
          </label>
          <input
            type="text"
            id="characters"
            placeholder="Enter important people"
          />
        </div>

        <button>Next</button>
      </div>
    </div>
  );
}

