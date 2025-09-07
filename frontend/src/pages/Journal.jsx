import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Journal.css";
import userAvatarUrl from "../assets/imgs/bp1.png";

const API_BASE_URL = "https://soul-link-1y76.onrender.com/api";

export default function Journal() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const navigate = useNavigate();
  const [journalEntry, setJournalEntry] = useState("Dear Diary, \n ");


  const wordCount = journalEntry.trim()
    ? (journalEntry.match(/\b\w+\b/g) || []).length
    : 0;

  const handleSave = async () => {
    if (journalEntry.trim().length === 0) {
      setSaveStatus("Please write something before saving.");
      setTimeout(() => setSaveStatus(""), 3000);
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
          user_id: "default_user", 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveStatus("Journal entry saved successfully!");

        localStorage.setItem(
          "latestJournalAnalysis",
          JSON.stringify({
            sentiment_analysis: data.sentiment_analysis,
            ai_suggestions: data.ai_suggestions,
            wellness_metrics: data.wellness_metrics,
            timestamp: new Date().toISOString(),
          })
        );

        // after success, navigate back or keep user here — short delay to show message
        setTimeout(() => {
          navigate("/dashboard");
        }, 1400);
      } else {
        setSaveStatus(`Error: ${data.error || "Failed to save journal entry"}`);
        setTimeout(() => setSaveStatus(""), 4000);
      }
    } catch (error) {
      console.error("Error saving journal:", error);
      setSaveStatus("Error: Could not connect to server. Please try again.");
      setTimeout(() => setSaveStatus(""), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraft = () => {
    if (journalEntry.trim().length === 0) {
      setSaveStatus("Please write something before saving as draft.");
      setTimeout(() => setSaveStatus(""), 3000);
      return;
    }

    const drafts = JSON.parse(localStorage.getItem("journalDrafts") || "[]");
    const newDraft = {
      id: Date.now(),
      content: journalEntry,
      created_at: new Date().toISOString(),
    };

    drafts.unshift(newDraft);
    localStorage.setItem("journalDrafts", JSON.stringify(drafts.slice(0, 10)));
    setSaveStatus("Saved as draft!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleBack = () => navigate("/dashboard");

  const onKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save quickly
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="journal-page landing">
      <div className="bg-circle bg-blue"></div>
      <div className="bg-circle bg-red"></div>
      <div className="bg-circle bg-yellow"></div>
      <div className="bg-circle bg-green"></div>

      <div className="journal-card">

        <main className="card-body">
            <div className="side-side">
                <div className="heading">
                     <h1 className="page-headin">Daily Journal</h1>
                     <p className="subtitle">Write down your thoughts, feelings, and reflections for today</p>
                </div>
                <header className="card-header">

          <div className="header-actions">
            <button className="back-btn" onClick={handleBack} aria-label="Back">
              <i className="fa-regular fa-house color-blue"></i>
            </button>

            {/* Replace with user avatar if available */}
            <div className="avatar-circle" title="Your profile">
              <img src={userAvatarUrl} alt="Avatar" className="avatar-circle" />
            </div>
          </div>
        </header>
            </div>

          <section className="journal-editor">
            <div className="editor-toolbar">
              <span className="date">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <div className="word-count">{wordCount} words</div>
            </div>

            <textarea
              className="journal-textarea lined-textarea"
              placeholder="How are you feeling today? What happened? What are you grateful for?"
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Journal entry text area"
              disabled={isLoading}
            />

            <div className="journal-actions">
              <button
                className="btn secondary draft-btn"
                onClick={handleSaveAsDraft}
                disabled={journalEntry.trim().length === 0 || isLoading}
                aria-label="Save as draft"
                title="Save as draft"
              >
                Save as Draft
              </button>

              <button
                className="btn primary save-btn"
                onClick={handleSave}
                disabled={journalEntry.trim().length === 0 || isLoading}
                aria-label="Save journal entry"
                title="Save (Ctrl/Cmd + Enter)"
              >
                {isLoading ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
