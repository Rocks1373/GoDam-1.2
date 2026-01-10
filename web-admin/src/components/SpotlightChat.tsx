import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./SpotlightChat.css";

const sendToAI = async (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`AI placeholder response for “${prompt}”`);
    }, 650);
  });
};

const SpotlightChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "typing" | "responded">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "F1") {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setResponse(null);
      setStatus("idle");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    if (response) {
      setResponse(null);
    }
    if (value.trim().length > 0) {
      setStatus("typing");
    } else {
      setStatus("idle");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = query.trim();
    if (!prompt || isSubmitting) return;

    setIsSubmitting(true);
    setStatus("responded");
    try {
      const aiResponse = await sendToAI(prompt);
      setResponse(aiResponse);
    } catch {
      setResponse("Unable to reach AI service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStateClass = response
    ? "spotlight-response-expanded"
    : status === "typing"
    ? "spotlight-expanded"
    : "spotlight-collapsed";

  return (
    <div className={`spotlight ${isOpen ? "spotlight-visible" : "spotlight-hidden"}`} aria-hidden={!isOpen}>
      <form
        role="dialog"
        aria-label="GoDAM Spotlight chat"
        className={`spotlight-card ${cardStateClass}`}
        onSubmit={handleSubmit}
      >
        <div className="spotlight-header">
          <span>GoDAM Spotlight</span>
          <button className="spotlight-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close spotlight">
            Esc
          </button>
        </div>

        <div className="spotlight-input-row">
          <div className="spotlight-input-wrapper">
            <input
              ref={inputRef}
              className="spotlight-input"
              type="text"
              name="spotlight-query"
              value={query}
              onChange={handleInputChange}
              placeholder="Ask GoDAM anything…"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="spotlight-keyhint">Option + F1 to open • Esc to close</span>
          </div>
          <button className="spotlight-submit" type="submit" disabled={!query.trim() || isSubmitting}>
            Send
          </button>
        </div>

        {response && (
          <div className="spotlight-response" role="status">
            <span className="spotlight-response-label">AI response</span>
            <p className="spotlight-response-text">{response}</p>
          </div>
        )}

        <div className="spotlight-footnote">
          Light, floating, responsive — ready for future AI wiring.
        </div>
      </form>
    </div>
  );
};

export default SpotlightChat;
