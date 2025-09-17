import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./page-styles/Dashboard.css";
// Import default avatar
import defaultAvatar from "../assets/imgs/avatar/row-1-column-1.png";
import avatar from "../assets/imgs/avatar/Male1-no bg.png";

// FontAwesome Icons
import {
  FaPen,
  FaSyncAlt,
  FaLightbulb,
  FaSmile,
  FaLeaf,
  FaCommentDots,
  FaStar,
  FaAppleAlt,
  FaUser,
  FaUsers,
  FaHome,
  FaBook,
  FaUserFriends,
  FaUserCircle,
} from "react-icons/fa";

const API_BASE_URL = "https://soul-link-1y76.onrender.com/api";

export default function Dashboard() {
  // --- state (kept identical to your existing logic) ---
  const [userPreferences, setUserPreferences] = useState({
    username: "User",
    characters: [],
    selectedAvatar: {
      id: "avatar1",
      name: "Friendly",
      image: defaultAvatar,
      description: "Cheerful and optimistic",
    },
  });
  const [todaysMood, setTodaysMood] = useState({
    mood: "calm",
    message: "You seem calm today",
    encouragement: "Keep it going!",
  });
  const [aiSuggestions, setAiSuggestions] = useState([
    { id: 1, text: "Start your day with journaling", icon: <FaPen /> },
    { id: 2, text: "Take a moment to breathe deeply", icon: <FaLeaf /> },
  ]);
  const [wellnessData, setWellnessData] = useState({
    score: 3,
    trend: 75,
    entries: 8,
  });
  const [achievements] = useState([
    { id: 1, icon: <FaSmile />, name: "Happy Mood", unlocked: true },
    { id: 2, icon: <FaLeaf />, name: "Growth", unlocked: true },
    { id: 3, icon: <FaCommentDots />, name: "Social", unlocked: true },
    { id: 4, icon: <FaStar />, name: "Achievement", unlocked: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Load user preferences from localStorage
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }

    // Check for latest journal analysis in localStorage
    const latestAnalysis = localStorage.getItem("latestJournalAnalysis");
    if (latestAnalysis) {
      const analysis = JSON.parse(latestAnalysis);
      if (analysis.ai_suggestions) {
        setAiSuggestions(
          analysis.ai_suggestions.map((s, idx) => ({
            id: idx + 1,
            text: s.text,
            icon: <FaLightbulb />,
          }))
        );
      }
      if (analysis.wellness_metrics) {
        setWellnessData({
          score: analysis.wellness_metrics.wellness_score,
          trend: analysis.wellness_metrics.mood_trend,
          entries: analysis.wellness_metrics.total_entries,
        });
      }
      if (analysis.sentiment_analysis) {
        updateMoodFromSentiment(analysis.sentiment_analysis);
      }
    }

    // Fetch fresh data from backend
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMoodFromSentiment = (sentimentData) => {
    const moodMessages = {
      happy: {
        message: "You're radiating positivity today!",
        encouragement: "Keep spreading that joy!",
      },
      calm: {
        message: "You seem peaceful and centered",
        encouragement: "Your balance is inspiring!",
      },
      sad: {
        message: "It seems like a tough day",
        encouragement: "Tomorrow is a new beginning!",
      },
      stressed: {
        message: "You seem overwhelmed today",
        encouragement: "Take it one step at a time!",
      },
      angry: {
        message: "You seem frustrated today",
        encouragement: "Take a moment to breathe and reset!",
      },
      tired: {
        message: "You seem exhausted today",
        encouragement: "Rest is productive too!",
      },
      neutral: {
        message: "How are you feeling today?",
        encouragement: "Your mood matters to us!",
      },
    };

    const moodInfo = moodMessages[sentimentData.mood] || moodMessages.calm;
    setTodaysMood({
      mood: sentimentData.mood,
      message: moodInfo.message,
      encouragement: moodInfo.encouragement,
    });
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await fetchTodaysMood();
      await fetchAISuggestions();
      await fetchWellnessData();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/suggestions?user_id=default_user`
      );
      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(
          data.suggestions.map((suggestion, index) => ({
            id: index + 1,
            text: suggestion.text,
            icon: <FaLightbulb />,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
  };

  const fetchWellnessData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/wellness?user_id=default_user`
      );
      if (response.ok) {
        const data = await response.json();
        const wellness = data.wellness_data;
        setWellnessData({
          score: wellness.wellness_score,
          trend: wellness.mood_trend,
          entries: wellness.total_entries,
        });
      }
    } catch (error) {
      console.error("Error fetching wellness data:", error);
    }
  };

  const fetchTodaysMood = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/mood?user_id=default_user`
      );
      if (response.ok) {
        const data = await response.json();
        setTodaysMood({
          mood: data.mood,
          message: data.message,
          encouragement: data.encouragement,
        });
      }
    } catch (error) {
      console.error("Error fetching mood data:", error);
    }
  };

  const handleJournalClick = () => {
    navigate("/journal");
  };

  const getMoodIcon = (mood) => {
    const moodIcons = {
      happy: <FaSmile />,
      calm: <FaSmile />,
      sad: <FaCommentDots />,
      stressed: <FaCommentDots />,
      angry: <FaCommentDots />,
      tired: <FaCommentDots />,
      neutral: <FaSmile />,
    };
    return moodIcons[mood] || <FaSmile />;
  };

  return (
    <div className="soul-dashboard-root">
      {/* Navbar is fixed by itself; put it here so it renders once per page */}
      <Navbar />

      {/* decorative background blobs (positioned under the content) */}
      <div className="bg-circle bg-blue" aria-hidden="true"></div>
      <div className="bg-circle bg-red" aria-hidden="true"></div>
      <div className="bg-circle bg-yellow" aria-hidden="true"></div>
      <div className="bg-circle bg-green" aria-hidden="true"></div>

      <main className="soul-dashboard-wrap" role="main" aria-label="Dashboard">
        {/* Left column cards */}
        <section className="soul-col left-col">
          <div
            className="soul-card card-journal"
            onClick={handleJournalClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handleJournalClick()}
          >
            <div className="card-row">
              <div className="card-icon">
                <FaPen />
              </div>
              <div className="card-body">
                <h4 className="card-title">Take a Journal</h4>
                <p className="card-sub">Write down your thoughts and feelings</p>
              </div>
            </div>
          </div>

          <div className="soul-card card-ai">
            <div className="card-head">
              <h4 className="card-title">AI Suggestions</h4>
              <button
                className="btn-refresh"
                onClick={fetchAISuggestions}
                aria-label="Refresh AI suggestions"
              >
                <FaSyncAlt />
              </button>
            </div>
            <div className="ai-list">
              {aiSuggestions.map((s) => (
                <div key={s.id} className="ai-item">
                  <span className="ai-icon">{s.icon}</span>
                  <span className="ai-text">{s.text}</span>
                </div>
              ))}
              <div className="ai-foot">
                <small>
                  <FaSyncAlt /> Powered by AI Backend
                </small>
              </div>
            </div>
          </div>

          <div className="soul-card card-achievements">
            <h4 className="card-title">Achievements</h4>
            <div className="ach-grid">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`ach-bubble ${a.unlocked ? "unlocked" : "locked"}`}
                  title={a.name}
                >
                  {a.icon}
                </div>
              ))}
            </div>
            <div className="ai-foot">
              <small>✏️ Editable in future updates</small>
            </div>
          </div>
        </section>

        <section className="soul-col center-col">
          <div className="avatar-panel">
            <div className="avatar-figure">
              {/* classname changed to match CSS (.avatar-large) */}
              <img src={avatar} alt="User Avatar" className="avatar-large" />
            </div>

            <div className="avatar-meta">
              <h2 className="greet">Hello, {userPreferences.username}!</h2>
              <p className="avatar-name">
                {userPreferences.selectedAvatar?.name || "Friendly"} Avatar
              </p>
              <p className="avatar-desc">
                {userPreferences.selectedAvatar?.description ||
                  "Cheerful and optimistic"}
              </p>
            </div>

            {isLoading && (
              <div className="loading-strip">
                <FaSyncAlt /> Loading your wellness data...
              </div>
            )}
          </div>
        </section>

        <section className="soul-col right-col">
          <div className="soul-card card-mood">
            <div className="card-head">
              <h4 className="card-title">Today's Mood</h4>
              <button
                className="btn-refresh"
                onClick={fetchTodaysMood}
                aria-label="Refresh mood data"
              >
                <FaSyncAlt />
              </button>
            </div>
            <div className="mood-body">
              <div className="mood-emoji">{getMoodIcon(todaysMood.mood)}</div>
              <div className="mood-texts">
                <p className="mood-message">{todaysMood.message}</p>
                <p className="mood-enc">{todaysMood.encouragement}</p>
              </div>
            </div>
          </div>

          <div className="soul-card card-wellness">
            <div className="card-head">
              <h4 className="card-title">Wellness Dashboard</h4>
              <button
                className="btn-refresh"
                onClick={fetchWellnessData}
                aria-label="Refresh wellness data"
              >
                <FaSyncAlt />
              </button>
            </div>
            <div className="wellness-body">
              <div className="wellness-score">
                <span className="well-icon">
                  <FaAppleAlt />
                </span>
                <span className="well-num">{wellnessData.score}</span>
              </div>
              <div className="well-stats">
                <div className="stat-row">
                  <span className="stat-label">Mood trend</span>
                  <div className="trend">
                    <div
                      className="trend-fill"
                      style={{ width: `${wellnessData.trend}%` }}
                    ></div>
                  </div>
                  <span className="stat-val">{wellnessData.trend}%</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">{wellnessData.entries} entries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="soul-card card-characters">
            <h4 className="card-title">Real-Life Characters</h4>
            <div className="chars-list">
              {userPreferences.characters && userPreferences.characters.length > 0 ? (
                userPreferences.characters.map((c, idx) => (
                  <div key={idx} className="char-item">
                    <div className="char-avatar-small">
                      <FaUser />
                    </div>
                    <div className="char-info">
                      <span className="c-name">{c.name}</span>
                      <span className="c-rel">{c.relation}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="char-item">
                    <div className="char-avatar-small">
                      <FaUser />
                    </div>
                    <div className="char-info">
                      <span className="c-name">Mom</span>
                      <span className="c-rel">Family</span>
                    </div>
                  </div>
                  <div className="char-item">
                    <div className="char-avatar-small">
                      <FaUserFriends />
                    </div>
                    <div className="char-info">
                      <span className="c-name">Best Friend</span>
                      <span className="c-rel">Friend</span>
                    </div>
                  </div>
                  <div className="pref-note">
                    <small>
                      <FaLightbulb /> Add characters in preferences
                    </small>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <nav className="soul-mobile-nav" aria-hidden={false}>
        <button className="nav-btn active" aria-label="Home">
          <FaHome />
        </button>
        <button className="nav-btn" aria-label="Library">
          <FaBook />
        </button>
        <button className="nav-btn" aria-label="Community">
          <FaUsers />
        </button>
        <button className="nav-btn" aria-label="Profile">
          <FaUserCircle />
        </button>
      </nav>
    </div>
  );
}
