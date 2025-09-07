import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Preferences.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import diary from "../assets/imgs/diary.png";
import questionnaire from "../assets/imgs/questionnaire.png";
import avatar1 from "../../RAW/gp1.png";
import avatar2 from "../../RAW/gp2.png";
import avatar3 from "../../RAW/bp1.png";
import avatar4 from "../../RAW/bp2.png";

export default function Preferences() {
  // core state
  const [diaryOption, setDiaryOption] = useState("Diary");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState([]);   // tags
  const [characters, setCharacters] = useState([]); // tags
  const [toast, setToast] = useState("");

  // avatar options & cycling index
  const avatarOptions = [
    { id: "avatar1", name: "Friendly", image: avatar1, description: "Cheerful and optimistic" },
    { id: "avatar2", name: "Calm", image: avatar2, description: "Peaceful and centered" },
    { id: "avatar3", name: "Wise", image: avatar3, description: "Thoughtful and intelligent" },
    { id: "avatar4", name: "Adventurous", image: avatar4, description: "Bold and confident" },
  ];
  const [avatarIndex, setAvatarIndex] = useState(0);
  const selectedAvatar = avatarOptions[avatarIndex];

  const navigate = useNavigate();

  // toast helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  };

  // tag input (Enter or comma)
  const handleKeyDown = (e, type) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
      e.preventDefault();

      const values = e.target.value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== "");

      if (type === "interests") {
        let newTags = [...interests];
        values.forEach((val) => {
          if (!newTags.includes(val) && newTags.length < 6) {
            newTags.push(val);
          } else if (newTags.includes(val)) {
            showToast(`"${val}" is already added!`);
          } else if (newTags.length >= 6) {
            showToast("You can only add up to 6 interests!");
          }
        });
        setInterests(newTags);
      } else if (type === "characters") {
        let newTags = [...characters];
        values.forEach((val) => {
          if (!newTags.includes(val) && newTags.length < 6) {
            newTags.push(val);
          } else if (newTags.includes(val)) {
            showToast(`"${val}" is already added!`);
          } else if (newTags.length >= 6) {
            showToast("You can only add up to 6 characters!");
          }
        });
        setCharacters(newTags);
      }

      e.target.value = "";
    }
  };

  const removeTag = (type, index) => {
    if (type === "interests") {
      setInterests(interests.filter((_, i) => i !== index));
    } else {
      setCharacters(characters.filter((_, i) => i !== index));
    }
  };

  // avatar navigation
  const prevAvatar = () =>
    setAvatarIndex((i) => (i - 1 + avatarOptions.length) % avatarOptions.length);
  const nextAvatar = () =>
    setAvatarIndex((i) => (i + 1) % avatarOptions.length);

  // actions
  const handleDiscard = () => {
    setUsername("");
    setInterests([]);
    setCharacters([]);
    setDiaryOption("Diary");
    setAvatarIndex(0);
    localStorage.removeItem("userPreferences");
    showToast("Changes discarded");
  };

  const handleAccept = () => {
    const preferences = {
      username: username || "User",
      interests,
      diaryType: diaryOption,
      characters: characters.map((char, index) => ({
        id: index + 1,
        name: char,
        relation: index === 0 ? "Family" : index === 1 ? "Friend" : "Important Person",
      })),
      selectedAvatar,
    };

    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    navigate("/dashboard");
  };

  return (
    <div className="landing preferences-page">
      {/* background blobs */}
      <div className="bg-circle bg-blue" />
      <div className="bg-circle bg-red" />
      <div className="bg-circle bg-yellow" />
      <div className="bg-circle bg-green" />

      {/* toast */}
      {toast && (
        <div className="toast">
          <i className="fa-solid fa-circle-exclamation"></i> {toast}
        </div>
      )}

      {/* main card (re-using auth-form base styles) */}
      <div className="auth-form preferences-card">
        <h2>Preferences</h2>
        <p className="subtitle">
          Customize your profile by choosing the preferences that best suit you
        </p>

        {/* two-column grid like the wireframe */}
        <div className="pref-grid">
          {/* LEFT PANE: avatar square + journal type below */}
          <section className="left-pane">
            <div className="avatar-square">
              <button
                className="nav-arrow left"
                onClick={prevAvatar}
                aria-label="Previous avatar"
                type="button"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              <div
                className="avatar-viewport"
                onClick={nextAvatar}
                title="Click to cycle avatar"
              >
                <div className="avatar-circle">
                  <img
                    src={selectedAvatar.image}
                    alt={selectedAvatar.name}
                    className="avatar-circle-img"
                  />
                </div>
                <div className="avatar-meta">
                  <div className="avatar-name">{selectedAvatar.name}</div>
                  <div className="avatar-description">
                    {selectedAvatar.description}
                  </div>
                </div>
              </div>

              <button
                className="nav-arrow right"
                onClick={nextAvatar}
                aria-label="Next avatar"
                type="button"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </section>

          {/* RIGHT PANE: inputs stacked vertically with space */}
          <section className="right-pane">
            <h3>Profile Details</h3>
            <div className="input-stack">
              {/* Username */}
              <div className="sub-flex">
                <label htmlFor="username" className="input-label">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Interests (tags) */}
              <div className="sub-flex">
                <label htmlFor="interests" className="input-label">
                  Interests
                </label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    id="interests"
                    placeholder="Type and press Enter"
                    onKeyDown={(e) => handleKeyDown(e, "interests")}
                  />
                  <div className="tags-list">
                    {interests.map((interest, index) => (
                      <div key={index} className="tag">
                        {interest}
                        <span
                          className="remove-tag"
                          onClick={() => removeTag("interests", index)}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Characters (tags) */}
              <div className="sub-flex">
                <label htmlFor="characters" className="input-label">
                  Characters
                </label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    id="characters"
                    placeholder="Type and press Enter"
                    onKeyDown={(e) => handleKeyDown(e, "characters")}
                  />
                  <div className="tags-list">
                    {characters.map((char, index) => (
                      <div key={index} className="tag">
                        {char}
                        <span
                          className="remove-tag"
                          onClick={() => removeTag("characters", index)}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* journal type selection below grid */}
        <div className="journal-type-section">
          
            {/* Journal type below avatar square */}
            <div className="section journal-section">
              <p className="section-title" style={{textAlign: "left", margin: "12px 0 24px 0"}}>Journal Type:</p>

              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${diaryOption === "Diary" ? "active" : ""}`}
                  onClick={() => setDiaryOption("Diary")}
                >
                  <div className="content-wrapper">
                    <div className="content-img">
                      <img src={diary} alt="Diary" className="type-image" />
                    </div>
                    <div className="text-content">
                      <p className="type-text">
                        <span className="type-title">Diary</span>{" "}
                        <span className="type-description">
                          If you like to freely express your thoughts, feelings,
                          and daily moments like a traditional diary.
                        </span>
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className={`toggle-btn ${
                    diaryOption === "Questionnaire" ? "active" : ""
                  }`}
                  onClick={() => setDiaryOption("Questionnaire")}
                >
                  <div className="content-wrapper">
                    <div className="content-img">
                      <img
                        src={questionnaire}
                        alt="Questionnaire"
                        className="type-image"
                      />
                    </div>
                    <div className="text-content">
                      <p className="type-text">
                        <span className="type-title">Questionnaire</span>{" "}
                        <span className="type-description">
                          If you prefer guided prompts. Each day you&apos;ll
                          answer thoughtful questions.
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="mode-section">
            <div className="modes">
                <label className="input-label">
                  Modes
                </label> <br />
              <p className="mode">
                <button className="mode light-mode"> <i className="fa-solid fa-sun"></i> Light</button>
              </p>
              <p className="mode">
                <button className="mode dark-mode"> <i className="fa-solid fa-moon"></i> Dark</button>
              </p>
            </div>
            {/* bottom actions row like the wireframe */}
        <div className="actions-row">
          <button
            type="button"
            className="btn ghost"
            onClick={handleDiscard}
            aria-label="Discard"
          >
            Discard
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={handleAccept}
            aria-label="Accept"
          >
            Accept
          </button>
        </div>
        </div>
        </div>

      </div>
    </div>
  );
}
