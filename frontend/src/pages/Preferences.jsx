import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Preferences.css";
import '@fortawesome/fontawesome-free/css/all.min.css';


import diary from "../assets/imgs/diary.png";
import questionnaire from "../assets/imgs/questionnaire.png";
import avatar1 from "../../RAW/gp1.png";
import avatar2 from "../../RAW/gp2.png";
import avatar3 from "../../RAW/bp1.png";
import avatar4 from "../../RAW/bp2.png";

export default function Preferences() {
  const [diaryOption, setDiaryOption] = useState("Diary");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState([]);   // array now
  const [characters, setCharacters] = useState([]); // array now
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1");
  const navigate = useNavigate();

  // Available avatar options
  const avatarOptions = [
    { id: "avatar1", name: "Friendly", image: avatar1, description: "Cheerful and optimistic" },
    { id: "avatar2", name: "Calm", image: avatar2, description: "Peaceful and centered" },
    { id: "avatar3", name: "Wise", image: avatar3, description: "Thoughtful and intelligent" },
    { id: "avatar4", name: "Adventurous", image: avatar4, description: "Bold and confident" },
  ];

  const handleNext = () => {
    // Save preferences to localStorage
    const preferences = {
      username: username || "User",
      interests: interests,
      diaryType: diaryOption,
      characters: characters.map((char, index) => ({
        id: index + 1,
        name: char,
        relation: index === 0 ? "Family" : index === 1 ? "Friend" : "Important Person"
      })),
      selectedAvatar: avatarOptions.find(avatar => avatar.id === selectedAvatar)
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    console.log("Saved preferences:", preferences);
    
    // Navigate to dashboard
    navigate("/dashboard");
  };

  // Add tag on Enter
  const handleKeyDown = (e, type) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
      e.preventDefault();
      if (type === "interests") {
        setInterests([...interests, e.target.value.trim()]);
      } else {
        setCharacters([...characters, e.target.value.trim()]);
      }
      e.target.value = "";
    }
  };

  // Remove tag
  const removeTag = (type, index) => {
    if (type === "interests") {
      setInterests(interests.filter((_, i) => i !== index));
    } else {
      setCharacters(characters.filter((_, i) => i !== index));
    }
  };

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
          <div className="flex-row">
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

            {/* Interests with tags */}
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
                      <span className="remove-tag" onClick={() => removeTag("interests", index)}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Characters with tags */}
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
                      <span className="remove-tag" onClick={() => removeTag("characters", index)}><i className="fa-solid fa-xmark"></i></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <p className="section-title">Choose Your Avatar:</p>
          <div className="avatar-selection">
            {avatarOptions.map((avatar) => (
              <div
                key={avatar.id}
                className={`avatar-option ${selectedAvatar === avatar.id ? "selected" : ""}`}
                onClick={() => setSelectedAvatar(avatar.id)}
              >
                <div className="avatar-image-container">
                  <img src={avatar.image} alt={avatar.name} className="avatar-image-preview" />
                </div>
                <div className="avatar-info">
                  <div className="avatar-name">{avatar.name}</div>
                  <div className="avatar-description">{avatar.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <p className="section-title">Journal Type:</p>
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
          <div className="type-info">
            <img 
              src={diaryOption === "Diary" ? diary : questionnaire} 
              alt="image" 
              className="type-image"
            />
            <p>
              {diaryOption === "Diary" 
                ? "Choose the Diary mode if you like to freely express your thoughts, feelings, and daily moments without restrictions. It's your personal space to vent, reflect, or even be creative—just like a traditional handwritten diary."
                : "Choose the Questionnaire mode if you prefer guided prompts. Each day you'll answer thoughtful questions designed to help you reflect, track your mood, and gain insights into your growth over time."}
            </p>
          </div>

        </div>
        <br />

        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
