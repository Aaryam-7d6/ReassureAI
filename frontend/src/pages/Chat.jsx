import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import {
  Send,
  Paperclip,
  AlertTriangle,
  Mic,
  Heart,
  Activity,
  Leaf,
  User,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODES = [
  {
    id: "mental_health",
    label: "Mental Health",
    icon: Heart,
    color: "var(--orange)",
    bg: "var(--orange-subtle)",
    activeBorder: "var(--orange)",
  },
  {
    id: "physical_health",
    label: "Physical Health",
    icon: Activity,
    color: "var(--purple)",
    bg: "var(--purple-subtle)",
    activeBorder: "var(--purple)",
  },
  {
    id: "ayurveda",
    label: "Ayurvedic",
    icon: Leaf,
    color: "var(--green)",
    bg: "var(--green-subtle)",
    activeBorder: "var(--green)",
  },
];

const SUGGESTED_PROMPTS = {
  mental_health: [
    "I've been feeling overwhelmed lately.",
    "How can I manage my anxiety?",
    "I'm having trouble sleeping.",
  ],
  physical_health: [
    "Can you help me understand my blood test?",
    "What are the symptoms of vitamin D deficiency?",
    "I've been getting frequent headaches.",
  ],
  ayurveda: [
    "How do I find out my dosha?",
    "What are some natural ways to improve digestion?",
    "How can I balance excess Vata?",
  ],
};

const MOCK_HISTORY = [
  { id: 1, title: "Anxiety management", date: "Today", mode: "mental_health" },
  {
    id: 2,
    title: "Blood test results",
    date: "Yesterday",
    mode: "physical_health",
  },
  {
    id: 3,
    title: "Digestion issues",
    date: "Previous 7 Days",
    mode: "ayurveda",
  },
];

// Framer motion variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

export default function Chat() {
  const { messages, setMessages, activeMode, setActiveMode, isCrisis } =
    useChat();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const currentMode = MODES.find((m) => m.id === activeMode) || MODES[0];

  const handleSend = (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText !== null ? customText : input;
    if (!textToSend.trim() || thinking) return;

    const userMsg = { id: Date.now(), text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    if (customText === null) setInput("");
    setThinking(true);

    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I'm here to support you. This is a placeholder response — the full AI backend will be connected shortly.",
          sender: "ai",
        },
      ]);
    }, 1400);
  };

  return (
    <div
      className="flex-1 w-full bg-[var(--bg-base)] transition-colors duration-300 flex overflow-hidden"
      style={{ height: "calc(100vh - 60px)" }}
    >
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="w-full h-full flex relative">
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            <div className="flex-1 flex flex-col w-full h-full py-4 gap-4 min-h-0 px-4 md:px-0">
              {/* Mode Selector */}
              <div
                className="flex gap-1.5 p-1.5 rounded-2xl w-fit mx-auto mt-2 mb-1 shadow-sm"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {MODES.map((mode) => {
                  const active = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`mode-${mode.id}`}
                      onClick={() => setActiveMode(mode.id)}
                      className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 outline-none"
                      style={{
                        color: active ? mode.color : "var(--text-muted)",
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeMode"
                          className="absolute inset-0 rounded-xl shadow-sm"
                          style={{
                            background: mode.bg,
                            border: `1px solid ${mode.activeBorder}`,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 40,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <mode.icon className="w-4 h-4" /> {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Crisis Banner */}
              <AnimatePresence>
                {isCrisis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "var(--orange-subtle)",
                      border: "1px solid var(--orange-border)",
                    }}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <AlertTriangle
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: "var(--orange)" }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--orange)",
                            marginBottom: "0.25rem",
                          }}
                        >
                          We're concerned about you
                        </p>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                          }}
                        >
                          It sounds like you might be going through something
                          difficult. Please reach out — iCall helpline:{" "}
                          <strong style={{ color: "var(--orange)" }}>
                            9152987821
                          </strong>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat window */}
              <div
                className="flex-1 rounded-3xl overflow-hidden flex flex-col min-h-0 relative shadow-xl"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  transition: "background 0.3s, border-color 0.3s",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  className="flex items-center gap-3 px-6 py-4 flex-shrink-0 z-10 backdrop-blur-md"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background:
                      "color-mix(in srgb, var(--bg-surface) 85%, transparent)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-inner"
                    style={{
                      background: currentMode.bg,
                      border: `1px solid ${currentMode.color}`,
                    }}
                  >
                    <currentMode.icon
                      className="w-4 h-4"
                      style={{ color: currentMode.color }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {currentMode.label} Assistant
                    </p>
                    <p
                      style={{ fontSize: "0.625rem", color: currentMode.color }}
                    >
                      ● Online
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3 min-h-0">
                  {messages.length === 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="m-auto text-center max-w-xl w-full px-4"
                    >
                      <div
                        className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                        style={{
                          background: currentMode.color,
                          border: `1px solid ${currentMode.activeBorder}`,
                        }}
                      >
                        <currentMode.icon className="w-7 h-7 text-white drop-shadow-md" />
                      </div>
                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Start a {currentMode.label} conversation
                      </h3>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          marginBottom: "2.5rem",
                        }}
                      >
                        Your messages are private and secure. How can I help you
                        today?
                      </p>

                      <div className="flex flex-col gap-2.5">
                        {SUGGESTED_PROMPTS[currentMode.id].map((prompt, i) => (
                          <motion.button
                            variants={itemVariants}
                            key={i}
                            onClick={() => handleSend(null, prompt)}
                            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm text-left transition-all duration-200 shadow-sm group"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              color: "var(--text-secondary)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                currentMode.color;
                              e.currentTarget.style.color =
                                "var(--text-primary)";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--border)";
                              e.currentTarget.style.color =
                                "var(--text-secondary)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <Sparkles
                              className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: currentMode.color }}
                            />
                            <span className="flex-1">{prompt}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-sm"
                            style={{
                              background:
                                msg.sender === "user"
                                  ? "var(--bg-elevated)"
                                  : currentMode.bg,
                              border: `1px solid ${msg.sender === "user" ? "var(--border)" : currentMode.color}`,
                            }}
                          >
                            {msg.sender === "user" ? (
                              <User
                                className="w-4 h-4"
                                style={{ color: "var(--text-secondary)" }}
                              />
                            ) : (
                              <currentMode.icon
                                className="w-4 h-4"
                                style={{ color: currentMode.color }}
                              />
                            )}
                          </div>
                          <div
                            className="shadow-sm"
                            style={{
                              padding: "0.75rem 1.125rem",
                              borderRadius:
                                msg.sender === "user"
                                  ? "1.25rem 1.25rem 0.25rem 1.25rem"
                                  : "1.25rem 1.25rem 1.25rem 0.25rem",
                              background:
                                msg.sender === "user"
                                  ? currentMode.bg
                                  : "var(--bg-elevated)",
                              border:
                                msg.sender === "user"
                                  ? `1px solid ${currentMode.color}`
                                  : "1px solid var(--border)",
                              fontSize: "0.9375rem",
                              color:
                                msg.sender === "user"
                                  ? "var(--text-primary)"
                                  : "var(--text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}

                  {/* Thinking indicator */}
                  <AnimatePresence>
                    {thinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex w-full justify-start"
                      >
                        <div className="flex gap-3 max-w-[85%] flex-row">
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-sm"
                            style={{
                              background: currentMode.bg,
                              border: `1px solid ${currentMode.color}`,
                            }}
                          >
                            <currentMode.icon
                              className="w-4 h-4"
                              style={{ color: currentMode.color }}
                            />
                          </div>
                          <div
                            className="shadow-sm"
                            style={{
                              padding: "0.875rem 1.125rem",
                              borderRadius: "1.25rem 1.25rem 1.25rem 0.25rem",
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="animate-breathe"
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: currentMode.color,
                                  display: "inline-block",
                                  animationDelay: `${i * 0.2}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div
                  className="p-4 flex-shrink-0 z-10 backdrop-blur-md"
                  style={{
                    borderTop: "1px solid var(--border)",
                    background:
                      "color-mix(in srgb, var(--bg-surface) 85%, transparent)",
                  }}
                >
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 max-w-4xl mx-auto rounded-2xl p-1.5 transition-all duration-300 shadow-sm focus-within:shadow-md"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                    }}
                    onFocus={(e) => {
                      if (!thinking)
                        e.currentTarget.style.borderColor = currentMode.color;
                    }}
                    onBlur={(e) => {
                      if (!thinking)
                        e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <button
                      type="button"
                      id="btn-attach"
                      aria-label="Attach file"
                      disabled={thinking}
                      className="p-2.5 rounded-xl flex-shrink-0 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        color: "var(--text-dim)",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!thinking)
                          e.currentTarget.style.color = "var(--brand)";
                      }}
                      onMouseLeave={(e) => {
                        if (!thinking)
                          e.currentTarget.style.color = "var(--text-dim)";
                      }}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask about your ${currentMode.label.toLowerCase()}...`}
                      id="chat-input"
                      disabled={thinking}
                      className="flex-1 bg-transparent px-2 py-3 text-[0.9375rem]"
                      style={{
                        color: "var(--text-primary)",
                        outline: "none",
                        fontFamily: "var(--font-sans)",
                        opacity: thinking ? 0.6 : 1,
                      }}
                    />

                    <button
                      type="button"
                      id="btn-mic"
                      aria-label="Use microphone"
                      disabled={thinking}
                      className="p-2.5 rounded-xl flex-shrink-0 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--text-dim)" }}
                      onMouseEnter={(e) => {
                        if (!thinking)
                          e.currentTarget.style.color = "var(--brand)";
                      }}
                      onMouseLeave={(e) => {
                        if (!thinking)
                          e.currentTarget.style.color = "var(--text-dim)";
                      }}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <button
                      type="submit"
                      id="btn-send"
                      disabled={!input.trim() || thinking}
                      className="p-3 rounded-xl flex-shrink-0 transition-all duration-300 shadow-sm"
                      style={{
                        background:
                          input.trim() && !thinking
                            ? currentMode.color
                            : "var(--bg-elevated)",
                        color:
                          input.trim() && !thinking
                            ? "#fff"
                            : "var(--text-dim)",
                        border: `1px solid ${input.trim() && !thinking ? currentMode.activeBorder : "transparent"}`,
                        cursor:
                          input.trim() && !thinking ? "pointer" : "not-allowed",
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
