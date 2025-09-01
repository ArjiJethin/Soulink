import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Preferences.css";

// Import avatar images
import avatar1 from "../assets/imgs/avatar/row-1-column-1.png";
import avatar2 from "../assets/imgs/avatar/row-1-column-2.png";
import avatar3 from "../assets/imgs/avatar/row-1-column-3.png";
import avatar4 from "../assets/imgs/avatar/row-2-column-1.png";
import avatar5 from "../assets/imgs/avatar/row-2-column-2.png";
import avatar6 from "../assets/imgs/avatar/row-2-column-3.png";
import avatar7 from "../assets/imgs/avatar/row-3-column-1.png";
import avatar8 from "../assets/imgs/avatar/row-3-column-2.png";
import avatar9 from "../assets/imgs/avatar/row-3-column-3.png";

export default function Preferences() {
  const [diaryOption, setDiaryOption] = useState("Diary");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState("");
  const [characters, setCharacters] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1");
  const navigate = useNavigate();

  // Available avatar options
  const avatarOptions = [
    { id: "avatar1", name: "Friendly", image: avatar1, description: "Cheerful and optimistic" },
    { id: "avatar2", name: "Calm", image: avatar2, description: "Peaceful and centered" },
    { id: "avatar3", name: "Wise", image: avatar3, description: "Thoughtful and intelligent" },
    { id: "avatar4", name: "Adventurous", image: avatar4, description: "Bold and confident" },
    { id: "avatar5", name: "Creative", image: avatar5, description: "Artistic and imaginative" },
    { id: "avatar6", name: "Nature Lover", image: avatar6, description: "Connected to nature" },
    { id: "avatar7", name: "Energetic", image: avatar7, description: "Dynamic and lively" },
    { id: "avatar8", name: "Mystical", image: avatar8, description: "Spiritual and intuitive" },
    { id: "avatar9", name: "Professional", image: avatar9, description: "Focused and determined" }
  ];

  const handleNext = () => {
    // Save preferences to localStorage
    const preferences = {
      username: username || "User",
      interests: interests,
      diaryType: diaryOption,
      characters: parseCharacters(characters),
      selectedAvatar: avatarOptions.find(avatar => avatar.id === selectedAvatar)
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    console.log("Saved preferences:", preferences);
    
    // Navigate to dashboard
    navigate("/dashboard");
  };

  const parseCharacters = (charactersString) => {
    if (!charactersString.trim()) return [];
    
    return charactersString.split(',').map((char, index) => ({
      id: index + 1,
      name: char.trim(),
      relation: index === 0 ? "Family" : index === 1 ? "Friend" : "Important Person"
    }));
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

        <div className="input-group">
          <label htmlFor="interests" className="input-label">
            Interests
          </label>
          <input
            type="text"
            id="interests"
            placeholder="Enter your interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
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
            placeholder="Enter important people (comma separated)"
            value={characters}
            onChange={(e) => setCharacters(e.target.value)}
          />
          <small className="input-hint">
            Example: Mom, Best Friend, Teacher
          </small>
        </div>

        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}

