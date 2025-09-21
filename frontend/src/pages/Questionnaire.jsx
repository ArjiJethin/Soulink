import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Questionnaire.css";
import userAvatarUrl from "../assets/imgs/bp1.png";

const API_BASE_URL = "http://127.0.0.1:5000/api";

// Questions (15)
const questions = [
    "I felt energetic and motivated today.",
    "I was able to focus on my tasks without distractions.",
    "I felt anxious or worried during the day.",
    "I enjoyed spending time with others.",
    "I felt lonely or isolated.",
    "I had a sense of accomplishment today.",
    "I felt stressed or overwhelmed.",
    "I was able to relax when I needed to.",
    "I felt optimistic about the future.",
    "I had negative thoughts I couldn’t control.",
    "I felt grateful for something today.",
    "I had trouble controlling my emotions.",
    "I felt connected to people around me.",
    "I felt bored or uninterested in activities.",
    "Overall, I would describe my mood as positive.",
];

const options = [
    "Strongly Disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly Agree",
];

export default function Questionnaire() {
    const [answers, setAnswers] = useState({}); // keys: question index => string option
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const navigate = useNavigate();

    const handleAnswer = (qIndex, value) => {
        setAnswers((prev) => ({ ...prev, [qIndex]: value }));
    };

    const handleSave = async () => {
        // build an array matching question order (null if unanswered)
        const answersArray = questions.map((_, i) => answers[i] ?? null);

        // If you want to allow partial submissions, remove this check.
        const missing = answersArray.some((a) => a === null);
        if (missing) {
            setSaveStatus("Please answer all questions before saving.");
            setTimeout(() => setSaveStatus(""), 3000);
            return;
        }

        setIsLoading(true);
        setSaveStatus("Saving...");

        const payload = {
            answers: answersArray,
            user_id: "default_user",
            submitted_at: new Date().toISOString(),
        };

        try {
            // log payload for easy debugging during development
            console.debug("Questionnaire payload:", payload);

            const response = await fetch(`${API_BASE_URL}/questionnaire`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                mode: "cors",
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                // backend returned non-JSON text — keep raw text for debugging
                data = { message: text };
            }

            if (response.ok) {
                setSaveStatus("Responses saved successfully!");
                // Save analysis if returned by backend (defensive)
                if (data?.sentiment_analysis || data?.wellness_metrics) {
                    localStorage.setItem(
                        "latestQuestionnaireAnalysis",
                        JSON.stringify({
                            sentiment_analysis: data.sentiment_analysis ?? null,
                            wellness_metrics: data.wellness_metrics ?? null,
                            timestamp: new Date().toISOString(),
                        })
                    );
                }
                setTimeout(() => navigate("/dashboard"), 1200);
            } else {
                const errMsg =
                    data?.error ||
                    data?.message ||
                    response.statusText ||
                    "Failed to save";
                setSaveStatus(`Error: ${errMsg}`);
                setTimeout(() => setSaveStatus(""), 4000);
            }
        } catch (error) {
            console.error("Error saving questionnaire:", error);
            setSaveStatus("Error: Could not connect to server.");
            setTimeout(() => setSaveStatus(""), 4000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAsDraft = () => {
        const drafts = JSON.parse(localStorage.getItem("qDrafts") || "[]");
        const newDraft = {
            id: Date.now(),
            answers: questions.map((_, i) => answers[i] ?? null),
            created_at: new Date().toISOString(),
        };
        drafts.unshift(newDraft);
        localStorage.setItem("qDrafts", JSON.stringify(drafts.slice(0, 10)));
        setSaveStatus("Saved as draft!");
        setTimeout(() => setSaveStatus(""), 2000);
    };

    const handleBack = () => navigate("/dashboard");

    return (
        <div className="q-page">
            <div className="q-card">
                <main className="q-card-body">
                    <div className="q-header">
                        <div>
                            <h1 className="q-title">Daily Questionnaire</h1>
                            <p className="q-subtitle">
                                Answer the following questions to reflect on
                                your day
                            </p>
                        </div>

                        <header className="q-card-header">
                            <div className="q-header-actions">
                                <button
                                    className="q-back-btn"
                                    onClick={handleBack}
                                    aria-label="Back"
                                >
                                    <i className="fa-regular fa-house color-blue"></i>
                                </button>
                                <div
                                    className="q-avatar-circle"
                                    title="Your profile"
                                >
                                    <img
                                        src={userAvatarUrl}
                                        alt="Avatar"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                </div>
                            </div>
                        </header>
                    </div>

                    <section className="q-questionnaire">
                        <div className="q-toolbar">
                            <span className="q-date">
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                        </div>

                        <div className="q-questions-list">
                            {questions.map((q, index) => (
                                <div key={index} className="q-question-block">
                                    <p className="q-question-text">
                                        {index + 1}. {q}
                                    </p>

                                    <div
                                        className="q-options"
                                        role="radiogroup"
                                        aria-label={`Question ${index + 1}`}
                                    >
                                        {options.map((opt, i) => (
                                            <label
                                                key={i}
                                                className="q-option"
                                                aria-checked={
                                                    answers[index] === opt
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q-${index}`}
                                                    value={opt}
                                                    checked={
                                                        answers[index] === opt
                                                    }
                                                    onChange={(e) =>
                                                        handleAnswer(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="q-actions">
                            <button
                                className="btn secondary q-draft-btn"
                                onClick={handleSaveAsDraft}
                                disabled={isLoading}
                                aria-label="Save as draft"
                            >
                                Save as Draft
                            </button>

                            <button
                                className="btn primary q-save-btn"
                                onClick={handleSave}
                                disabled={isLoading}
                                aria-label="Save responses"
                                title="Save responses"
                            >
                                {isLoading ? "Saving..." : "Save Responses"}
                            </button>
                        </div>

                        {saveStatus && (
                            <div
                                className={`q-save-status ${
                                    saveStatus.toLowerCase().includes("error")
                                        ? "error"
                                        : saveStatus
                                              .toLowerCase()
                                              .includes("saved") ||
                                          saveStatus
                                              .toLowerCase()
                                              .includes("success")
                                        ? "success"
                                        : ""
                                }`}
                                role="status"
                            >
                                {saveStatus}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
