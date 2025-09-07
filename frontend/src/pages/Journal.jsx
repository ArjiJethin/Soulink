import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./page-styles/Journal.css";
import userAvatarUrl from "../assets/imgs/bp1.png";

const userPreferences = {
  characters: [
    { name: "Mom", relation: "Family" },
    { name: "Best Friend", relation: "Friend" },
    { name: "Alice", relation: "Colleague" },
  ],
};

const API_BASE_URL = "https://soul-link-1y76.onrender.com/api";

export default function Journal() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const navigate = useNavigate();
  const [journalEntry, setJournalEntry] = useState("Dear Diary, \n ");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCharacters, setFilteredCharacters] = useState([]);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);

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
        headers: { "Content-Type": "application/json" },
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

  const [text, setText] = useState("");

  // Replace mentions with span
  const highlightMentions = (input) => {
    const mentionRegex = /(@\w+)/g;
    return input.replace(
      mentionRegex,
      `<span class="mention">$1</span>`
    );
  };

  // --- @ mentions: detect + filter + position
  const handleChange = (e) => {
    const value = e.target.value;
    setJournalEntry(value);

    const cursorPos = e.target.selectionStart;
    const textUntilCursor = value.slice(0, cursorPos);

    const match = textUntilCursor.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const suggestions = (userPreferences.characters?.length
        ? userPreferences.characters
        : [
            { name: "Mom", relation: "Family" },
            { name: "Best Friend", relation: "Friend" },
          ]).filter((char) => char.name.toLowerCase().includes(query));

      setFilteredCharacters(suggestions);
      setShowSuggestions(true);
      updateCaretPosition(e.target); // position right where user is typing
    } else {
      setShowSuggestions(false);
    }
  };

  // --- precisely compute caret coords, then push dropdown 20px down
const updateCaretPosition = (textarea) => {
  const mirror = mirrorRef.current;
  if (!mirror) return;

  const cs = window.getComputedStyle(textarea);

  // Mirror must exactly replicate textarea styles
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordBreak = "break-word";
  mirror.style.overflowWrap = "anywhere";
  mirror.style.boxSizing = "border-box";
  mirror.style.width = `${textarea.clientWidth}px`;

  // Copy typography & spacings
  mirror.style.font = cs.font;
  mirror.style.fontFamily = cs.fontFamily;
  mirror.style.fontSize = cs.fontSize;
  mirror.style.lineHeight = cs.lineHeight;
  mirror.style.letterSpacing = cs.letterSpacing;
  mirror.style.padding = cs.padding;
  mirror.style.border = cs.border;
  mirror.style.textAlign = cs.textAlign;

  // Text up to caret
  const before = textarea.value.substring(0, textarea.selectionStart);
  mirror.textContent = before;

  // Place marker at caret
  const marker = document.createElement("span");
  marker.textContent = "\u200b"; // zero-width space
  mirror.appendChild(marker);

  const markerRect = marker.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();

  // Drop 20px below the line
  const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) || 20;

  setCaretPos({
    top:
      markerRect.top -
      textareaRect.top +
      textarea.scrollTop +
      lineHeight +
      20,
    left:
      markerRect.left -
      textareaRect.left +
      textarea.scrollLeft,
  });
};


  const handleSelectCharacter = (character) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = journalEntry.slice(0, cursorPos);
    const textAfter = journalEntry.slice(cursorPos);

    const newText =
      textBefore.replace(/@(\w*)$/, `@${character.name} `) + textAfter;

    setJournalEntry(newText);
    setShowSuggestions(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newText.length, newText.length);
    }, 0);
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
              <p className="subtitle">
                Write down your thoughts, feelings, and reflections for today
              </p>
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
              ref={textareaRef}
              className="journal-textarea lined-textarea"
              value={journalEntry}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              onKeyUp={() => textareaRef.current && updateCaretPosition(textareaRef.current)}
              onClick={() => textareaRef.current && updateCaretPosition(textareaRef.current)}
              onScroll={() => textareaRef.current && updateCaretPosition(textareaRef.current)}
            />

            {/* Hidden mirror for caret tracking */}
            <div ref={mirrorRef} className="mirror-div"></div>

            {/* Suggestion dropdown following caret */}
            {showSuggestions && filteredCharacters.length > 0 && (
              <div
                className="mention-suggestions"
                style={{
                  position: "absolute",
                  top: `${caretPos.top}px`,
                  left: `${caretPos.left}px`,
                }}
              >
                {filteredCharacters.map((char, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => handleSelectCharacter(char)}
                  >
                    <strong>@{char.name}</strong> <span>({char.relation})</span>
                  </div>
                ))}
              </div>
            )}

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
