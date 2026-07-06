import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { chatApi } from "../api/chatApi";
import { reportApi } from "../api/reportApi";
import { feedbackApi } from "../api/feedbackApi";
import { useToast } from "../components/Toast";
import ResponseActionBar from "../components/ResponseActionBar";
import {
  Send,
  Paperclip,
  AlertTriangle,
  Mic,
  Heart,
  Activity,
  Sparkles,
  Upload,
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
  } = useChat();
  const { addToast } = useToast();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const currentMode = MODES.find((m) => m.id === activeMode) || MODES[0];
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const fileInputRef = useRef(null);
  const MODE_DESCRIPTIONS = {
    mental_health: "Mental health mode uses a supportive emotional chain powered by a specialized conversational model.",
    physical_health: "Physical health mode uses symptom analysis routing and blended medical/ayurvedic model responses.",
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Clear chat history when the conversation mode changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setIsCrisis(false);
  }, [activeMode, setConversationId, setIsCrisis, setMessages]);

  // Clear input when messages are cleared (e.g. New chat clicked)
  useEffect(() => {
    if (messages.length === 0) {
      setInput("");
    }
  }, [messages]);

  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText !== null ? customText : input;
    if (!textToSend.trim() || thinking) return;

    const userMessage = { id: Date.now(), text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    if (customText === null) setInput("");
    setThinking(true);
    setIsCrisis(false);

    try {
      const response = await chatApi.sendMessage({
        query: textToSend,
        conversation_id: conversationId || undefined,
        processing_type: activeMode,
      });

      const assistantPayload = response?.data?.message || {};
      const assistantText =
        assistantPayload.content ||
        response?.data?.response ||
        "I’m here to help.";
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
      setThinking(false);
    }
  };

  const uploadReport = async () => {
    if (!attachedFile) return;
    setUploadingReport(true);
    try {
      const response = await reportApi.upload(attachedFile);
      const payload = response?.data || {};
      addToast(
        payload.status === "processed"
          ? "Report processed successfully."
          : payload.message || "Report uploaded and is being analysed.",
        payload.status === "processed" ? "success" : "info",
      );

      const assistantMessage = {
        id: Date.now() + 2,
        text:
          payload.simplified_report ||
          "Your report was uploaded successfully. The summary will appear once processing completes.",
        sender: "ai",
        mode: activeMode,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setAttachedFile(null);
      setConversationId(null);
    } catch (error) {
      addToast(
        error.response?.data?.detail ||
          "Unable to upload the report right now.",
        "error",
      );
    } finally {
      setUploadingReport(false);
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
                  className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
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
                    <div
                      style={{
                        padding: "0.625rem 1rem",
                        borderRadius:
                          msg.sender === "user"
                            ? "1.25rem 1.25rem 0.25rem 1.25rem"
                            : "0.25rem 1.25rem 1.25rem 1.25rem",
                        background:
                          msg.sender === "user"
                            ? currentMode.bg
                            : "transparent",
                        border:
                          msg.sender === "user"
                            ? `1px solid ${currentMode.color}30`
                            : "none",
                        fontSize: "0.9375rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.65,
                      }}
                    >
                      {msg.text}
                    </div>

                    {msg.sender === "ai" && (
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
          {/* Attach */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                setAttachedFile(selectedFile);
              }
            }}
          />
          <button
            type="button"
            id="btn-attach"
            aria-label="Attach file"
            disabled={thinking || uploadingReport}
            className="p-2 rounded-xl flex-shrink-0 transition-colors duration-150 disabled:opacity-40"
            style={{ color: "var(--text-muted)", background: "transparent" }}
            onMouseEnter={(e) => {
              if (!thinking && !uploadingReport) e.currentTarget.style.color = currentMode.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </button>

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

          {/* Attach status */}
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <Upload className="w-4 h-4" style={{ color: currentMode.color }} />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                {attachedFile.name}
              </span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAttachedFile(null)}
                className="text-sm text-red-500"
                style={{ background: "transparent", border: "none" }}
              >
                ×
              </button>
            </div>
          )}

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

          {/* Send */}
          <button
            type="submit"
            id="btn-send"
            disabled={!input.trim() || thinking}
            className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                input.trim() && !thinking
                  ? currentMode.color
                  : "var(--bg-elevated)",
              color: input.trim() && !thinking ? "#fff" : "var(--text-muted)",
            }}
          >
            <Send className="w-4 h-4" />
          </button>
          {attachedFile && (
            <button
              type="button"
              onClick={uploadReport}
              disabled={uploadingReport || thinking}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: uploadingReport
                  ? "var(--bg-elevated)"
                  : currentMode.bg,
                color: uploadingReport ? "var(--text-muted)" : currentMode.color,
              }}
            >
              {uploadingReport ? "Uploading..." : "Upload File"}
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
