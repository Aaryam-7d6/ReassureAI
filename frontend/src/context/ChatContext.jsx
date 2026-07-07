import { createContext, useState, useContext } from "react";
import chatApi from "../api/chatApi";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [activeMode, setActiveMode] = useState("mental_health");
  const [isCrisis, setIsCrisis] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState("all");

  const fetchConversations = async () => {
    setLoadingHistory(true);
    try {
      const res = await chatApi.history();
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await chatApi.getConversation(id);
      const conversation = res.data;
      setConversationId(conversation.id);

      const mapped = (conversation.messages || []).map((m) => {
        const isUser = m.role === "user";
        return {
          id: m.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
          text: m.content,
          sender: isUser ? "user" : "ai",
          messageId: m.id,
          metadata: m.metadata || {},
          mode: isUser ? activeMode : (m.metadata?.processing_type || "mental_health"),
        };
      });
      setMessages(mapped);

      // Determine activeMode based on the last assistant message
      const lastAssistant = [...(conversation.messages || [])]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant?.metadata?.processing_type) {
        setActiveMode(lastAssistant.metadata.processing_type);
      }
    } catch (err) {
      console.error("Failed to load conversation", err);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await chatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
        setIsCrisis(false);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        activeMode,
        setActiveMode,
        isCrisis,
        setIsCrisis,
        conversationId,
        setConversationId,
        conversations,
        setConversations,
        fetchConversations,
        loadConversation,
        deleteConversation,
        loadingHistory,
        selectedModel,
        setSelectedModel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
