import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./page-styles/Dashboard.css";

// Import default avatar
import defaultAvatar from "../assets/imgs/avatar/row-1-column-1.png";

const API_BASE_URL = "https://soul-link-1y76.onrender.com/api";

export default function Dashboard() {
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
        { id: 1, text: "Start your day with journaling", icon: "📝" },
        { id: 2, text: "Take a moment to breathe deeply", icon: "🧘" },
    ]);
    const [wellnessData, setWellnessData] = useState({
        score: 3,
        trend: 75,
        entries: 8,
    });
    const [achievements] = useState([
        { id: 1, icon: "😊", name: "Happy Mood", unlocked: true },
        { id: 2, icon: "🌱", name: "Growth", unlocked: true },
        { id: 3, icon: "💬", name: "Social", unlocked: true },
        { id: 4, icon: "⭐", name: "Achievement", unlocked: false },
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
            // Update with fresh analysis if available
            if (analysis.ai_suggestions) {
                setAiSuggestions(analysis.ai_suggestions);
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
            // Fetch mood data
            await fetchTodaysMood();
            // Fetch AI suggestions
            await fetchAISuggestions();
            // Fetch wellness data
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
                        icon: suggestion.icon,
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching AI suggestions:", error);
            // Keep default suggestions on error
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
            // Keep default wellness data on error
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
            // Keep default mood on error
        }
    };

    const handleJournalClick = () => {
        navigate("/journal");
    };

    const getMoodEmoji = (mood) => {
        const moodEmojis = {
            happy: "😊",
            calm: "😌",
            sad: "😞",
            stressed: "😰",
            angry: "😠",
            tired: "😴",
            neutral: "😐",
        };
        return moodEmojis[mood] || "😊";
    };

    return (
        <div className="dashboard-container dark-theme">
            <Navbar />

            <div className="dashboard-content">
                {/* Main Character Section */}
                <div className="character-section">
                    <div className="character-avatar">
                        <div className="avatar-display">
                            <div className="avatar-image-large">
                                <img
                                    src={
                                        userPreferences.selectedAvatar?.image ||
                                        defaultAvatar
                                    }
                                    alt={
                                        userPreferences.selectedAvatar?.name ||
                                        "Avatar"
                                    }
                                    className="avatar-img"
                                />
                            </div>
                            <div className="avatar-info-display">
                                <h2 className="username-display">
                                    Hello, {userPreferences.username}!
                                </h2>
                                <p className="avatar-name-display">
                                    {userPreferences.selectedAvatar?.name ||
                                        "Friendly"}{" "}
                                    Avatar
                                </p>
                                <p className="avatar-description-display">
                                    {userPreferences.selectedAvatar
                                        ?.description ||
                                        "Cheerful and optimistic"}
                                </p>
                            </div>
                        </div>
                    </div>
                    {isLoading && (
                        <div className="loading-indicator">
                            <span>🔄 Loading your wellness data...</span>
                        </div>
                    )}
                </div>

                {/* Dashboard Grid */}
                <div className="dashboard-grid">
                    {/* Take a Journal */}
                    <div
                        className="dashboard-card journal-card"
                        onClick={handleJournalClick}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) =>
                            e.key === "Enter" && handleJournalClick()
                        }
                    >
                        <div className="card-header">
                            <span className="card-icon">📝</span>
                            <h3>Take a Journal</h3>
                        </div>
                        <p className="card-description">
                            Write down your thoughts and feelings
                        </p>
                    </div>

                    {/* Today's Mood */}
                    <div className="dashboard-card mood-card">
                        <div className="card-header">
                            <h3>Today's Mood</h3>
                            <button
                                className="refresh-btn"
                                onClick={fetchTodaysMood}
                                aria-label="Refresh mood data"
                            >
                                🔄
                            </button>
                        </div>
                        <div className="mood-content">
                            <div className="mood-emoji">
                                {getMoodEmoji(todaysMood.mood)}
                            </div>
                            <p className="mood-message">{todaysMood.message}</p>
                            <p className="mood-encouragement">
                                ✨ {todaysMood.encouragement}
                            </p>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="dashboard-card suggestions-card">
                        <div className="card-header">
                            <h3>AI Suggestions</h3>
                            <button
                                className="refresh-btn"
                                onClick={fetchAISuggestions}
                                aria-label="Refresh AI suggestions"
                            >
                                🔄
                            </button>
                        </div>
                        <div className="suggestions-content">
                            {aiSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="suggestion-item"
                                >
                                    <span className="suggestion-icon">
                                        {suggestion.icon}
                                    </span>
                                    <span className="suggestion-text">
                                        {suggestion.text}
                                    </span>
                                </div>
                            ))}
                            <div className="api-placeholder">
                                <small>🔄 Powered by AI Backend</small>
                            </div>
                        </div>
                    </div>

                    {/* Wellness Dashboard */}
                    <div className="dashboard-card wellness-card">
                        <div className="card-header">
                            <h3>Wellness Dashboard</h3>
                            <button
                                className="refresh-btn"
                                onClick={fetchWellnessData}
                                aria-label="Refresh wellness data"
                            >
                                🔄
                            </button>
                        </div>
                        <div className="wellness-content">
                            <div className="wellness-score">
                                <span className="score-icon">🍎</span>
                                <span className="score-number">
                                    {wellnessData.score}
                                </span>
                            </div>
                            <div className="wellness-stats">
                                <div className="stat-item">
                                    <span className="stat-label">
                                        Mood trend
                                    </span>
                                    <div className="trend-container">
                                        <div className="trend-bar">
                                            <div
                                                className="trend-fill"
                                                style={{
                                                    width: `${wellnessData.trend}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className="stat-value">
                                            {wellnessData.trend}%
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">
                                        {wellnessData.entries} entries
                                    </span>
                                </div>
                            </div>
                            <div className="api-placeholder">
                                <small>📊 Backend Analytics</small>
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="dashboard-card achievements-card">
                        <div className="card-header">
                            <h3>Achievements</h3>
                        </div>
                        <div className="achievements-content">
                            <div className="achievements-grid">
                                {achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`achievement-item ${
                                            achievement.unlocked
                                                ? "unlocked"
                                                : "locked"
                                        }`}
                                        title={achievement.name}
                                    >
                                        <span className="achievement-icon">
                                            {achievement.icon}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="edit-placeholder">
                                <small>✏️ Editable in future updates</small>
                            </div>
                        </div>
                    </div>

                    {/* Real-Life Characters */}
                    <div className="dashboard-card characters-card">
                        <div className="card-header">
                            <h3>Real-Life Characters</h3>
                        </div>
                        <div className="characters-content">
                            {userPreferences.characters &&
                            userPreferences.characters.length > 0 ? (
                                <div className="characters-grid">
                                    {userPreferences.characters.map(
                                        (character, index) => (
                                            <div
                                                key={index}
                                                className="character-item"
                                            >
                                                <div className="character-avatar-small">
                                                    {character.name?.charAt(
                                                        0
                                                    ) || "👤"}
                                                </div>
                                                <div className="character-info">
                                                    <span className="character-name">
                                                        {character.name}
                                                    </span>
                                                    <span className="character-relation">
                                                        {character.relation}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="characters-placeholder">
                                    <div className="character-item">
                                        <div className="character-avatar-small">
                                            👩
                                        </div>
                                        <div className="character-info">
                                            <span className="character-name">
                                                Mom
                                            </span>
                                            <span className="character-relation">
                                                Family
                                            </span>
                                        </div>
                                    </div>
                                    <div className="character-item">
                                        <div className="character-avatar-small">
                                            👨
                                        </div>
                                        <div className="character-info">
                                            <span className="character-name">
                                                Best Friend
                                            </span>
                                            <span className="character-relation">
                                                Friend
                                            </span>
                                        </div>
                                    </div>
                                    <div className="preferences-note">
                                        <small>
                                            💡 Add characters in preferences
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
