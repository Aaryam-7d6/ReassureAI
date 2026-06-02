# ReassureAI — Frontend Codebase

> **Updated every time frontend code changes.**

---

## Status: Not started. Start with TASK-F01.

---

## Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- react-markdown + remark-gfm (markdown rendering)
- Axios (HTTP, withCredentials: true always)
- React Router v6
- Web Speech API (browser native TTS — no library needed)

---

## Folder Structure

```
frontend/
├── index.html
├── vite.config.js           # proxy /api → http://localhost:8000
├── tailwind.config.js
├── package.json
│
└── src/
    ├── main.jsx
    ├── App.jsx               # Router setup
    │
    ├── pages/
    │   ├── Home.jsx          # Landing page
    │   ├── Auth.jsx          # Sign In / Sign Up tabs
    │   ├── Dashboard.jsx     # Post-login home
    │   └── Chat.jsx          # Main chat interface
    │
    ├── components/
    │   ├── Navbar.jsx
    │   ├── FeatureCard.jsx
    │   ├── ChatMessage.jsx       # Single message bubble with metadata
    │   ├── ResponseActionBar.jsx # TTS + Copy + Regenerate + Feedback
    │   ├── ChatInput.jsx         # Multiline input (Shift+Enter = newline)
    │   ├── ModeSelector.jsx      # Mental Health / Physical / Ayurveda / Report
    │   ├── CrisisCard.jsx        # Emergency resources (cannot dismiss)
    │   ├── ReportViewer.jsx      # Markdown report display
    │   ├── ScrollToBottom.jsx    # Floating ↓ arrow button
    │   ├── Timestamp.jsx         # "Today at 2:34 PM" format
    │   ├── Spinner.jsx
    │   └── Toast.jsx             # Feedback saved / duplicate file notifications
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ChatContext.jsx
    │
    ├── hooks/
    │   ├── useChat.js
    │   ├── useAuth.js
    │   ├── useReport.js
    │   ├── useTTS.js             # Web Speech API wrapper
    │   └── useAutoScroll.js      # Auto-scroll + show/hide ↓ button
    │
    ├── api/
    │   ├── chatApi.js
    │   ├── authApi.js
    │   ├── reportApi.js
    │   └── feedbackApi.js        # like/dislike submission
    │
    └── utils/
        ├── formatters.js         # timestamp formatting
        └── validators.js         # client-side email + password checks
```

---

## Instructions for package.json

Don't use version aka pinned versions because pinned versions cause conflicts as packages update.

```
{
  "name": "reassureai-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "framer-motion": "^11.0.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

Using `^` means "this version or higher compatible version" — gives flexibility without breaking changes.

---

## Key Component Implementations

### ChatInput.jsx — Multiline + Enter to send

```jsx
function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text.trim());
        setText("");
      }
    }
    // Shift+Enter → default textarea behavior (new line)
  };

  return (
    <div className="relative">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Ask about your health..."
        className="w-full resize-none rounded-xl border..."
        style={{ maxHeight: "200px" }}
      />
      <p className="text-xs text-gray-400 mt-1">
        ReassureAI can make mistakes. Cross-verify important health information.
      </p>
    </div>
  );
}
```

### ResponseActionBar.jsx — TTS + Copy + Regenerate + Feedback

```jsx
function ResponseActionBar({ text, messageId, conversationId, onRegenerate }) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

  const handleTTS = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (value) => {
    setFeedback(value);
    await feedbackApi.submit({ conversationId, messageId, feedback: value });
  };

  return (
    <div className="flex gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
      <button onClick={handleTTS} title="Read aloud">
        {speaking ? "🔇" : "🔊"}
      </button>
      <button onClick={handleCopy} title="Copy">
        {copied ? "✓" : "📋"}
      </button>
      <button onClick={onRegenerate} title="Regenerate">
        🔄
      </button>
      <button
        onClick={() => handleFeedback("like")}
        className={feedback === "like" ? "text-green-500" : ""}
        title="Good response"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback("dislike")}
        className={feedback === "dislike" ? "text-red-500" : ""}
        title="Bad response"
      >
        👎
      </button>
    </div>
  );
}
```

### ChatMessage.jsx — Markdown + Timestamp

```jsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatMessage({ message, onRegenerate }) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-3xl ${isAssistant ? "bg-gray-800" : "bg-blue-600"} rounded-xl p-4`}
      >
        {isAssistant ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-invert max-w-none"
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="text-white whitespace-pre-wrap">{message.content}</p>
        )}
        <Timestamp value={message.timestamp} />
        {isAssistant && (
          <ResponseActionBar
            text={message.content}
            messageId={message.id}
            conversationId={message.conversationId}
            onRegenerate={onRegenerate}
          />
        )}
      </div>
    </div>
  );
}
```

### useAutoScroll.js

```js
import { useRef, useState, useEffect } from "react";

export function useAutoScroll(dependency) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dependency]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  return {
    bottomRef,
    containerRef,
    showScrollButton,
    scrollToBottom,
    handleScroll,
  };
}
```

---

## API Integration Status

| Component     | Endpoint                    | Status    |
| ------------- | --------------------------- | --------- |
| Auth sign in  | POST /api/v1/auth/login     | Not wired |
| Auth sign up  | POST /api/v1/auth/register  | Not wired |
| Auth me       | GET /api/v1/auth/me         | Not wired |
| Chat send     | POST /api/v1/chat           | Not wired |
| Chat history  | GET /api/v1/chat/history    | Not wired |
| Feedback      | POST /api/v1/feedback       | Not wired |
| Report upload | POST /api/v1/reports/upload | Not wired |
| Reports list  | GET /api/v1/reports         | Not wired |

---

## Crisis Response Handling

When backend returns `{ crisis: true }`:

1. Hide normal chat input
2. Show CrisisCard component (cannot be dismissed)
3. CrisisCard displays empathetic message + hotlines
4. New conversation button resets state

```jsx
{
  response.crisis ? <CrisisCard /> : <ChatMessage message={response} />;
}
```

---

## How Agent Updates This

When adding a new component or hook:

1. Add to folder structure
2. Add description
3. Update API integration table
