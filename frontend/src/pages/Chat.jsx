import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import { ResponseActionBar } from "../components/ResponseActionBar";
import { CrisisCard } from "../components/CrisisCard";

const ChatMessage = ({
  message,
  isUser,
  onRegenerate,
  onFeedback,
  isLoading,
}) => {
  const getTimestamp = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const today = now.toDateString() === messageDate.toDateString();

    if (today) {
      return messageDate
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(/\s/g, " ");
    }
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className="max-w-md lg:max-w-xl">
        <div
          className={`${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"} rounded-2xl px-5 py-3 shadow-md`}
        >
          {!isUser && (
            <div className="prose prose-sm max-w-none text-sm mb-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          )}
          {isUser && <p className="text-sm">{message.text}</p>}
          <div
            className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"}`}
          >
            {getTimestamp(message.timestamp)}
          </div>
        </div>
        {/* Action bar for AI messages only */}
        {!isUser && (
          <ResponseActionBar
            responseText={message.text}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
};

const ChatInput = ({ onSendMessage, disabled, onFileUpload }) => {
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSendMessage(input);
        setInput("");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {isDragging && (
        <div className="mb-4 p-4 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50 text-center">
          <p className="text-blue-600 font-medium">Drop your report here</p>
        </div>
      )}
      <div
        className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-600 text-sm">
          📁 Drag & drop a report (PDF/Image) or click to upload
        </p>
      </div>

      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={disabled}
          rows={3}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              onSendMessage(input);
              setInput("");
            }
          }}
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium h-full"
        >
          Send
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        ⚠️ <strong>Disclaimer:</strong> ReassureAI can make mistakes.
        Cross-verify important health information with healthcare professionals.
      </p>
    </div>
  );
};

const ModeSelector = ({ mode, setMode, disabled }) => {
  const modes = [
    { value: "mental_health", label: "🧠 Mental Health" },
    { value: "physical_health", label: "💊 Physical Health" },
    { value: "ayurveda", label: "🌿 Ayurveda" },
    { value: "report", label: "📄 Report" },
  ];

  return (
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      disabled={disabled}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
    >
      {modes.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
};

const ScrollToBottomButton = ({ visible, onClick }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition animate-bounce"
      title="Scroll to latest"
    >
      ↓
    </button>
  );
};

export default function Chat() {
  const location = useLocation();
  const initialMode = location.state?.mode || "mental_health";

  const [mode, setMode] = useState(initialMode);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ReassureAI. How can I help you today? Feel free to ask about mental health, physical health, or upload a medical report.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleSendMessage = async (text) => {
    const userMessage = {
      id: messages.length + 1,
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Mock API call — replace with real endpoint later
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse = {
        id: messages.length + 2,
        text: `**Response in ${mode} mode:**\n\nI understand you're asking about "${text.substring(0, 30)}..."\n\nThis is a mock response. Real responses will come from the backend API when integrated.`,
        isUser: false,
        timestamp: new Date(),
      };

      // Crisis detection: Check for crisis keywords (in real app, backend would determine this)
      const crisisKeywords = [
        "suicide",
        "self harm",
        "hurt myself",
        "end my life",
        "can't take it",
        "hopeless",
        "kill myself",
        "crisis",
        "emergency",
      ];
      const isCrisis = crisisKeywords.some((keyword) =>
        text.toLowerCase().includes(keyword),
      );

      if (isCrisis) {
        setShowCrisisCard(true);
      }

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    const userMessage = {
      id: messages.length + 1,
      text: `📎 Uploaded: ${file.name}`,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Mock file processing — replace with real endpoint later
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiResponse = {
        id: messages.length + 2,
        text: `**Report Summary:**\n\nThank you for uploading "${file.name}". Here's a simplified summary:\n\n- **Key findings:** Placeholder text\n- **Recommendations:** Regular health check-ups\n- **Next steps:** Consult a healthcare professional\n\n*(This is a mock response. Real analysis comes from backend)*`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Failed to process file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((msg) => msg.isUser);

    if (lastUserMessage) {
      // Remove the last AI response if exists
      const lastAIIndex = messages.reverse().findIndex((msg) => !msg.isUser);
      if (lastAIIndex !== -1) {
        setMessages((prev) => prev.slice(0, prev.length - lastAIIndex - 1));
      }

      // Resend the last user message
      handleSendMessage(lastUserMessage.text);
    }
  };

  const handleFeedback = async (messageId, feedbackType) => {
    try {
      // Mock feedback submission — replace with real API endpoint later
      await axios.post(
        "/api/v1/feedback",
        {
          message_id: messageId,
          feedback: feedbackType,
        },
        { withCredentials: true },
      );
      console.log(`Feedback ${feedbackType} recorded for message ${messageId}`);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            <p className="text-sm text-gray-600">
              Mode: {mode.replace(/_/g, " ")}
            </p>
          </div>
          <ModeSelector mode={mode} setMode={setMode} disabled={isLoading} />
        </div>
      </div>

      {/* Crisis Card - Always visible when crisis detected */}
      {showCrisisCard && (
        <div className="max-w-4xl mx-auto w-full px-6 pt-4">
          <CrisisCard />
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isUser={msg.isUser}
            onRegenerate={handleRegenerate}
            onFeedback={(type) => handleFeedback(msg.id, type)}
            isLoading={isLoading}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="bg-gray-100 rounded-2xl px-5 py-3 text-gray-600">
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <ScrollToBottomButton
        visible={showScrollButton}
        onClick={scrollToBottom}
      />

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}
