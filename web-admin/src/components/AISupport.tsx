import { useState, useRef, useEffect, useCallback } from "react";
import "./AICustomerSupport.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AISupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "deepak_user_name";
const WELCOME_SHOWN_KEY = "deepak_welcome_shown";

const AISupport: React.FC<AISupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [welcomeShown, setWelcomeShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load stored user name on component mount
  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEY);
    if (storedName) {
      setUserName(storedName);
    }
    const hasWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (hasWelcome) {
      setWelcomeShown(true);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show welcome messages when chat opens
  useEffect(() => {
    if (isOpen && !welcomeShown) {
      showWelcomeMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, welcomeShown]);

  const showWelcomeMessages = async () => {
    const welcomeMsgs: Omit<Message, "id">[] = [
      {
        role: "assistant",
        content: "Hey how you doing",
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: "i am Deepak here",
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: "Ready to help",
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: "go on",
        timestamp: new Date().toISOString(),
      },
    ];

    // Add user name personalization if available
    let personalizedLastMsg = "";
    if (userName) {
      personalizedLastMsg = `, ${userName}`;
    }

    // Add personalized message at the end
    welcomeMsgs.push({
      role: "assistant",
      content: `How can i help you today${personalizedLastMsg}?`,
      timestamp: new Date().toISOString(),
    });

    // Show messages with delay
    for (let i = 0; i < welcomeMsgs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessages((prev) => [
        ...prev,
        { ...welcomeMsgs[i], id: `welcome-${Date.now()}-${i}` },
      ]);
    }

    setWelcomeShown(true);
    localStorage.setItem(WELCOME_SHOWN_KEY, "true");
  };

  // Extract name from user message
  const extractAndStoreName = useCallback((text: string) => {
    // Patterns to detect name introduction
    const namePatterns = [
      /my name is\s+([A-Za-z]+)/i,
      /i'm\s+([A-Za-z]+)/i,
      /i am\s+([A-Za-z]+)/i,
      /this is\s+([A-Za-z]+)/i,
      /call me\s+([A-Za-z]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1];
        setUserName(name);
        localStorage.setItem(STORAGE_KEY, name);
        return name;
      }
    }
    return null;
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Check if user is introducing themselves
    extractAndStoreName(input.trim());

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Use environment variable or default to relative path for production proxy
      const aiEndpoint = import.meta.env.VITE_AI_API_URL || "/api/chat";
      
      const response = await fetch(aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          include_orders: true,
          include_stock: true,
          user_name: userName, // Send stored user name
        }),
      });

      if (!response.ok) {
        throw new Error("AI service unavailable");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setError("AI service is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetWelcome = () => {
    setMessages([]);
    setWelcomeShown(false);
    localStorage.removeItem(WELCOME_SHOWN_KEY);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-support-overlay">
      <div className="ai-support-container">
        <div className="ai-support-header">
          <div className="ai-support-title">
            <span className="ai-icon">AI</span>
            <span>Deepak</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="ai-close-btn"
              onClick={resetWelcome}
              title="Reset conversation"
              style={{ fontSize: "12px" }}
            >
              ↻
            </button>
            <button className="ai-close-btn" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        <div className="ai-support-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <div className="ai-message-content">{msg.content}</div>
              <div className="ai-message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <div className="ai-message-content ai-loading">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </div>
            </div>
          )}
          {error && (
            <div className="ai-error-message">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-support-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={userName ? `Hi ${userName}, what would you like to ask?` : "Ask me anything..."}
            rows={2}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISupport;
