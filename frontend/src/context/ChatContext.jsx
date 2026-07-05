import { createContext, useState, useContext } from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [activeMode, setActiveMode] = useState("mental_health");
  const [isCrisis, setIsCrisis] = useState(false);
  const [conversationId, setConversationId] = useState(null);

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
