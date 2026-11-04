import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Sparkles, UserRound, RotateCcw, MessageCircle } from "lucide-react";
import api from "../api/client";
import "./AIAssistant.css";

const suggestions = [
  "Explain the rules of the 100-metre race",
  "How should a beginner prepare for an athletics meet?",
  "What makes a good warm-up before running?",
  "Help me understand track and field events",
];

const welcomeMessage = {
  role: "assistant",
  content:
    "Hi! I'm AthletiQ, your IIT BHU Athletics assistant. Ask me about track and field, competition rules, preparation, or general athletics knowledge. I'm still being connected to the website's live event and result data, so I won't pretend to know information I can't verify.",
};

export default function AIAssistant() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      // The welcome message is UI copy, not conversation history for the model.
      const conversation = nextMessages
        .filter((message, index) => !(index === 0 && message === welcomeMessage))
        .slice(-12)
        .map(({ role, content: messageContent }) => ({ role, content: messageContent }));

      const response = await api.post("/assistant/chat", { messages: conversation });
      const answer = response.data?.answer;
      if (!answer) throw new Error("The assistant returned an empty response.");
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.error;
      setError(
        serverMessage ||
          "I couldn't reach the AI service. Check that the backend is running and its AI API key is configured, then try again."
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    setMessages([welcomeMessage]);
    setDraft("");
    setError("");
    inputRef.current?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <main className="ai-page">
      <section className="ai-shell" aria-label="AthletiQ AI assistant">
        <header className="ai-heading">
          <div className="ai-heading-icon"><Sparkles size={24} /></div>
          <div>
            <p className="ai-eyebrow">IIT BHU ATHLETICS</p>
            <h1>Meet AthletiQ</h1>
            <p className="ai-subtitle">Your AI assistant for athletics, training basics, and track & field.</p>
          </div>
          <button className="ai-reset" type="button" onClick={resetChat} title="Start a new chat" aria-label="Start a new chat">
            <RotateCcw size={17} /><span>New chat</span>
          </button>
        </header>

        <div className="ai-notice">
          <span className="ai-status-dot" />
          <span>AI preview · Verify important training advice with a qualified coach. Live event data is not connected yet.</span>
        </div>

        <section className="ai-conversation" aria-live="polite" aria-label="Conversation">
          {messages.map((message, index) => (
            <article className={`ai-message ${message.role === "user" ? "is-user" : "is-assistant"}`} key={`${index}-${message.role}`}>
              <div className="ai-avatar" aria-hidden="true">
                {message.role === "user" ? <UserRound size={18} /> : <Bot size={19} />}
              </div>
              <div className="ai-message-content">
                <span className="ai-message-author">{message.role === "user" ? "You" : "AthletiQ"}</span>
                <p>{message.content}</p>
              </div>
            </article>
          ))}

          {isSending && (
            <article className="ai-message is-assistant">
              <div className="ai-avatar"><Bot size={19} /></div>
              <div className="ai-message-content">
                <span className="ai-message-author">AthletiQ</span>
                <p className="ai-typing" aria-label="AthletiQ is thinking"><span /><span /><span /></p>
              </div>
            </article>
          )}
          <div ref={bottomRef} />
        </section>

        {messages.length === 1 && (
          <section className="ai-suggestions" aria-label="Suggested questions">
            <div className="ai-suggestions-title"><MessageCircle size={16} /> Try asking</div>
            <div className="ai-suggestion-list">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} disabled={isSending}>
                  {suggestion}<ArrowUp size={15} />
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <div className="ai-error" role="alert">{error}</div>}

        <form className="ai-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="ai-message-input">Message AthletiQ</label>
          <textarea
            id="ai-message-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Ask AthletiQ a question..."
            rows={1}
            maxLength={2000}
            disabled={isSending}
          />
          <button type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
            <ArrowUp size={20} />
          </button>
          <p>Enter to send · Shift + Enter for a new line</p>
        </form>
      </section>
    </main>
  );
}
