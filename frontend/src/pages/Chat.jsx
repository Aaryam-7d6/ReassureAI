import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { chatApi } from "../api/chatApi";
import { feedbackApi } from "../api/feedbackApi";
import { useToast } from "../components/Toast";
import ResponseActionBar from "../components/ResponseActionBar";
import {
  Send,
  Square,
  AlertTriangle,
  Mic,
  Heart,
  Activity,
  Sparkles,
  Copy,
  Pencil,
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
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

export default function Chat() {
  const {
    messages,
    setMessages,
    activeMode,
    isCrisis,
    setIsCrisis,
    conversationId,
    setConversationId,
    selectedModel,
    setSelectedModel,
    fetchConversations,
  } = useChat();
  const { addToast } = useToast();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (conversationId) {
      fetchConversations();
    }
  }, [conversationId]);

  const currentMode = MODES.find((m) => m.id === activeMode) || MODES[0];
  const MODE_DESCRIPTIONS = {
    mental_health: "Mental health mode uses a supportive emotional chain powered by a specialized conversational model.",
    physical_health: "Physical health mode uses symptom analysis routing and blended medical/ayurvedic model responses.",
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSaveEdit = async (msgId, newText) => {
    if (!newText.trim() || thinking) return;
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;

    const truncated = messages.slice(0, idx);
    setMessages(truncated);
    setEditingMessageId(null);
    setEditText("");

    await handleSend(null, newText);
  };

  // Clear input when messages are cleared (e.g. New chat clicked)
  useEffect(() => {
    if (messages.length === 0) {
      setInput("");
    }
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setThinking(false);
  };

  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText !== null ? customText : input;
    if (!textToSend.trim() || thinking) return;

    const userMessage = { id: Date.now(), text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    if (customText === null) setInput("");
    setThinking(true);
    setIsCrisis(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await chatApi.sendMessage(
        {
          query: textToSend,
          conversation_id: conversationId || undefined,
          processing_type: activeMode,
          selected_model: activeMode === "physical_health" ? selectedModel : undefined,
        },
        { signal: controller.signal },
      );

      const assistantPayload = response?.data?.message || {};
      const assistantText =
        assistantPayload.content ||
        response?.data?.response ||
        "I'm here to help.";
      const assistantMessage = {
        id: assistantPayload.id
          ? `assistant-${assistantPayload.id}`
          : Date.now() + 1,
        text: assistantText,
        sender: "ai",
        messageId: assistantPayload.id,
        metadata: assistantPayload.metadata || response?.data?.metadata,
        mode: activeMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response?.data?.conversation_id || conversationId);
      setIsCrisis(Boolean(response?.data?.is_crisis));
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        // User clicked stop — do nothing, thinking already cleared by handleStop
        return;
      }
      addToast(
        error.response?.data?.detail ||
          "Unable to reach the assistant right now.",
        "error",
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, I could not reach the assistant right now. Please try again in a moment.",
          sender: "ai",
        },
      ]);
    } finally {
      abortControllerRef.current = null;
      setThinking(false);
    }
  };

  const handleRegenerate = async (messageText) => {
    if (!messageText) return;
    await handleSend(null, messageText);
  };

  const handleFeedback = async (messageId, vote) => {
    if (!messageId) return;
    try {
      await feedbackApi.submit(messageId, vote);
      addToast("Feedback saved", "success");
    } catch (error) {
      addToast(
        error.response?.data?.detail || "Unable to save feedback right now.",
        "error",
      );
    }
  };

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ height: "calc(100vh - 60px)", background: "var(--bg-base)" }}
    >
      {/* Crisis Banner */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div
              className="mx-auto max-w-3xl px-4 py-3 mt-3 rounded-xl flex items-start gap-3"
              style={{
                background: "var(--orange-subtle)",
                border: "1px solid var(--orange-border)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "var(--orange)" }}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--orange)",
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
                  Please reach out — iCall helpline:{" "}
                  <strong style={{ color: "var(--orange)" }}>9152987821</strong>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center justify-center min-h-[55vh] text-center"
            >
              <motion.div
                variants={itemVariants}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: currentMode.color }}
              >
                <currentMode.icon className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                How can I help you today?
              </motion.h2>

              <motion.p
                variants={itemVariants}
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-muted)",
                  marginBottom: "1.25rem",
                }}
              >
                Ask me anything about your {currentMode.label.toLowerCase()}.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: currentMode.color,
                  background: currentMode.bg,
                }}
              >
                <p className="font-semibold" style={{ color: currentMode.color }}>
                  Current mode: {currentMode.label}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  {MODE_DESCRIPTIONS[currentMode.id]}
                </p>
                <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                  Backend processing_type: <strong>{activeMode}</strong>
                </p>
              </motion.div>

              {/* Suggested prompts */}
              <motion.div
                variants={itemVariants}
                className="grid gap-2 w-full max-w-lg"
              >
                {SUGGESTED_PROMPTS[currentMode.id].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(null, prompt)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 group"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentMode.color;
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    <Sparkles
                      className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: currentMode.color }}
                    />
                    <span>{prompt}</span>
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* ── Messages ── */
            <div className="flex flex-col gap-6 pb-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 group ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
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
                  )}

                  <div
                    className={`max-w-[75%] ${msg.sender === "ai" ? "flex flex-col gap-2" : ""}`}
                  >
                    {msg.sender === "user" ? (
                      editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2 w-full min-w-[250px] p-2 bg-[var(--bg-elevated)] border rounded-2xl">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full p-2 text-sm rounded-lg border outline-none bg-transparent"
                            style={{
                              borderColor: currentMode.color,
                              color: "var(--text-primary)",
                            }}
                            rows={Math.max(2, editText.split("\n").length)}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="px-2.5 py-1 text-xs rounded border cursor-pointer"
                              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id, editText)}
                              className="px-2.5 py-1 text-xs rounded text-white cursor-pointer font-medium"
                              style={{ background: currentMode.color }}
                            >
                              Save & Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <div
                            style={{
                              padding: "0.625rem 1rem",
                              borderRadius: "1.25rem 1.25rem 0.25rem 1.25rem",
                              background: currentMode.bg,
                              border: `1px solid ${currentMode.color}30`,
                              fontSize: "0.9375rem",
                              color: "var(--text-primary)",
                              lineHeight: 1.65,
                            }}
                          >
                            {msg.text}
                          </div>
                          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                addToast("Prompt copied to clipboard!", "success");
                              }}
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              style={{ background: "transparent", border: "none" }}
                              title="Copy prompt"
                            >
                              <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditText(msg.text);
                              }}
                              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              style={{ background: "transparent", border: "none" }}
                              title="Edit prompt"
                            >
                              <Pencil className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        <div
                          style={{
                            padding: "0.625rem 1rem",
                            borderRadius: "0.25rem 1.25rem 1.25rem 1.25rem",
                            fontSize: "0.9375rem",
                            color: "var(--text-primary)",
                            lineHeight: 1.65,
                          }}
                        >
                          {msg.text}
                        </div>
                        {msg.metadata?.sources && (
                          <div className="flex flex-wrap gap-1 px-1 mb-1 select-none">
                            {msg.metadata.sources.map((src, idx) => (
                              <span
                                key={idx}
                                className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider"
                                style={{
                                  borderColor: "var(--border)",
                                  background: "var(--bg-elevated)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {src === "openbiollm" ? "OpenBioLLM" : src === "ayurparam" ? "AyurParam" : src === "mistral" ? "Mistral" : src === "rag" ? "RAG" : src === "mistral_fusion" ? "Fused Response" : src}
                              </span>
                            ))}
                          </div>
                        )}
                        <ResponseActionBar
                          responseText={msg.text}
                          disabled={thinking}
                          messageId={msg.id}
                          activeSpeechMessageId={activeSpeechMessageId}
                          onSpeechStateChange={setActiveSpeechMessageId}
                          onRegenerate={() => handleRegenerate(msg.text)}
                          onFeedback={(vote) =>
                            handleFeedback(msg.messageId, vote)
                          }
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Thinking dots */}
              <AnimatePresence>
                {thinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
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
                      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Floating input bar ── */}
      <div
        className="flex-shrink-0 px-4 pb-5 pt-2 sticky bottom-0 z-10"
        style={{ background: "var(--bg-base)" }}
      >
        {activeMode === "physical_health" && (
          <div className="max-w-3xl mx-auto mb-3 flex gap-2 items-center justify-start text-[0.8rem] flex-wrap">
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Select Model:</span>
            {[
              { id: "all", label: "Both (Fused)" },
              { id: "openbiollm", label: "OpenBioLLM (Modern)" },
              { id: "ayurparam", label: "AyurParam (Ayurvedic)" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className="px-3 py-1 rounded-full border transition-all cursor-pointer text-xs"
                style={{
                  borderColor: selectedModel === m.id ? "var(--purple)" : "var(--border)",
                  background: selectedModel === m.id ? "var(--purple-subtle)" : "var(--bg-surface)",
                  color: selectedModel === m.id ? "var(--purple)" : "var(--text-secondary)",
                  fontWeight: selectedModel === m.id ? 600 : 400,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all duration-200"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = currentMode.color;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${currentMode.label} assistant…`}
            id="chat-input"
            disabled={thinking}
            className="flex-1 bg-transparent px-1 py-2.5 text-[0.9375rem] outline-none"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              opacity: thinking ? 0.6 : 1,
            }}
          />

          {/* Mic */}
          <button
            type="button"
            id="btn-mic"
            aria-label="Use microphone"
            disabled={thinking}
            className="p-2 rounded-xl flex-shrink-0 transition-colors duration-150 disabled:opacity-40"
            style={{ color: "var(--text-muted)", background: "transparent" }}
            onMouseEnter={(e) => {
              if (!thinking) e.currentTarget.style.color = currentMode.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send / Stop */}
          {thinking ? (
            <button
              type="button"
              id="btn-stop"
              aria-label="Stop generating"
              onClick={handleStop}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 cursor-pointer"
              style={{
                background: "#ef4444",
                color: "#fff",
              }}
              title="Stop generating"
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              id="btn-send"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim()
                  ? currentMode.color
                  : "var(--bg-elevated)",
                color: input.trim() ? "#fff" : "var(--text-muted)",
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <p
          className="text-center mt-2"
          style={{ fontSize: "0.6875rem", color: "var(--text-dim)" }}
        >
          ReassureAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
