import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./page-styles/Journal.css";

const API_BASE_URL = "https://soul-link-1y76.onrender.com/api";

export default function Journal() {
    const [journalEntry, setJournalEntry] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const navigate = useNavigate();

    const handleSave = async () => {
        if (journalEntry.trim().length === 0) {
            setSaveStatus("Please write something before saving.");
            return;
        }

        setIsLoading(true);
        setSaveStatus("Saving...");

        try {
            const response = await fetch(`${API_BASE_URL}/journal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: journalEntry,
                    user_id: "default_user", // You can get this from user context/auth
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSaveStatus("Journal entry saved successfully!");

                // Store the analysis results in localStorage for dashboard
                localStorage.setItem(
                    "latestJournalAnalysis",
                    JSON.stringify({
                        sentiment_analysis: data.sentiment_analysis,
                        ai_suggestions: data.ai_suggestions,
                        wellness_metrics: data.wellness_metrics,
                        timestamp: new Date().toISOString(),
                    })
                );

                // Navigate back to dashboard after a short delay
                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                setSaveStatus(
                    `Error: ${data.error || "Failed to save journal entry"}`
                );
            }
        } catch (error) {
            console.error("Error saving journal:", error);
            setSaveStatus(
                "Error: Could not connect to server. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (journalEntry.trim().length === 0) {
            setSaveStatus("Please write something before saving as draft.");
            return;
        }

        // For now, just save to localStorage as draft
        const drafts = JSON.parse(
            localStorage.getItem("journalDrafts") || "[]"
        );
        const newDraft = {
            id: Date.now(),
            content: journalEntry,
            created_at: new Date().toISOString(),
        };

        drafts.unshift(newDraft);
        localStorage.setItem(
            "journalDrafts",
            JSON.stringify(drafts.slice(0, 10))
        ); // Keep only 10 drafts

        setSaveStatus("Saved as draft!");
        setTimeout(() => setSaveStatus(""), 3000);
    };

    const handleBack = () => {
        navigate("/dashboard");
    };

    return (
        <div className="journal-container">
            <div className="journal-content">
                <div className="journal-header">
                    <button
                        className="back-btn"
                        onClick={handleBack}
                        aria-label="Back to Dashboard"
                    >
                        ← Back to Dashboard
                    </button>
                    <h2>Daily Journal</h2>
                    <p>
                        Write down your thoughts, feelings, and reflections for
                        today
                    </p>
                </div>

                <div className="journal-editor">
                    <div className="editor-toolbar">
                        <span className="date">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                        <div className="word-count">
                            {
                                journalEntry
                                    .split(" ")
                                    .filter((word) => word.length > 0).length
                            }{" "}
                            words
                        </div>
                    </div>

                    <textarea
                        className="journal-textarea"
                        placeholder="How are you feeling today? What happened? What are you grateful for?"
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                        rows={20}
                        aria-label="Journal entry text area"
                        disabled={isLoading}
                    />

                    {saveStatus && (
                        <div
                            className={`save-status ${
                                saveStatus.includes("Error")
                                    ? "error"
                                    : "success"
                            }`}
                        >
                            {saveStatus}
                        </div>
                    )}

                    <div className="journal-actions">
                        <button
                            className="save-btn"
                            onClick={handleSave}
                            disabled={
                                journalEntry.trim().length === 0 || isLoading
                            }
                            aria-label="Save journal entry"
                        >
                            {isLoading ? "Saving..." : "Save Entry"}
                        </button>
                        <button
                            className="draft-btn"
                            onClick={handleSaveAsDraft}
                            disabled={
                                journalEntry.trim().length === 0 || isLoading
                            }
                            aria-label="Save as draft"
                        >
                            Save as Draft
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
