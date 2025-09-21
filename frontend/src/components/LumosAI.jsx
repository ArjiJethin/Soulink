import { useState } from "react";
import "../App.css";
import lumosIcon from "../assets/imgs/lumos.png";

function LumosAI({ suggestions }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi, I’m Lumos AI. How can I help?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", text: input }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/mistral", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: input,
                    context: suggestions || "No additional context provided.",
                }),
            });

            const data = await res.json();
            setMessages([
                ...newMessages,
                { role: "assistant", text: data.reply || "..." },
            ]);
        } catch (err) {
            setMessages([
                ...newMessages,
                { role: "assistant", text: "⚠️ Error fetching response." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <div className="lumos-btn" onClick={() => setIsOpen(!isOpen)}>
                <img src={lumosIcon} alt="Lumos AI" className="lumos-icon" />
            </div>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className={`lumos-box soul-card ${
                        isMaximized ? "fullscreen" : ""
                    }`}
                >
                    <div className="lumos-head">
                        <h3 className="card-title">Lumos AI</h3>
                        <div className="lumos-controls">
                            <button
                                className="lumos-toggle"
                                onClick={() => setIsMaximized(!isMaximized)}
                            >
                                {isMaximized ? "↙︎" : "↖"}
                            </button>
                            <button
                                className="lumos-close"
                                onClick={() => setIsOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <div className="lumos-chat">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div className="msg assistant">...</div>}
                    </div>

                    <div className="lumos-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) =>
                                e.key === "Enter" && sendMessage()
                            }
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default LumosAI;
