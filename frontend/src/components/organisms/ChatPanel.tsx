import { useState, type KeyboardEvent } from "react";
import type { ChatEntry, A2uiStatus } from "../../hooks/useA2ui";
import "../../css/organisms/chat-panel.css";

interface ChatPanelProps {
  messages: ChatEntry[];
  status: A2uiStatus;
  errorMessage: string | null;
  onSend: (content: string) => void;
}

export function ChatPanel({ messages, status, errorMessage, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim() || status === "loading") return;
    onSend(draft);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="chat-panel">
      <h2 className="chat-panel__title">Conversación</h2>

      <div className="chat-panel__history">
        {messages.length === 0 && <p className="chat-panel__empty">Escribe un mensaje para empezar.</p>}
        {messages.map((entry) => (
          <div key={entry.id} className={`chat-bubble chat-bubble--${entry.role}`}>
            {entry.text}
          </div>
        ))}
        {status === "loading" && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
            <span className="chat-spinner" aria-hidden="true" />
            Generando respuesta…
          </div>
        )}
      </div>

      {status === "error" && errorMessage && <p className="chat-panel__error">{errorMessage}</p>}

      <div className="chat-panel__composer">
        <textarea
          className="chat-panel__input"
          rows={2}
          value={draft}
          placeholder="Ayúdame a planear mi retiro…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="chat-panel__send" onClick={handleSend} disabled={status === "loading" || !draft.trim()}>
          Enviar
        </button>
      </div>
    </section>
  );
}
