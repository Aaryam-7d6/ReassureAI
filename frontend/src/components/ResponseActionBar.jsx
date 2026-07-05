import React, { useState } from "react";
import SpeakButton from "./SpeakButton";

const Toast = ({ message, visible, duration = 3000 }) => {
  const [isVisible, setIsVisible] = React.useState(visible);

  React.useEffect(() => {
    if (visible) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-out">
      {message}
    </div>
  );
};

export const ResponseActionBar = ({
  responseText,
  onRegenerate,
  onFeedback,
  disabled,
  messageId,
  activeSpeechMessageId,
  onSpeechStateChange,
}) => {
  const [feedbackSent, setFeedbackSent] = useState(null); // null, 'like', 'dislike'
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleCopy = () => {
    const plainText = responseText
      .replace(/\*\*/g, "")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1");

    navigator.clipboard.writeText(plainText).then(() => {
      setToastMessage("Copied to clipboard!");
      setShowToast(true);
    });
  };

  const handleFeedback = (type) => {
    setFeedbackSent(type);
    if (onFeedback) {
      onFeedback(type);
    }
    setToastMessage(`Response ${type === "like" ? "👍" : "👎"} saved!`);
    setShowToast(true);

    // Reset feedback selection after 2 seconds
    setTimeout(() => setFeedbackSent(null), 2000);
  };

  return (
    <>
      <div className="flex gap-2 mt-3 text-gray-600">
        <SpeakButton
          text={responseText}
          messageId={messageId}
          activeMessageId={activeSpeechMessageId}
          onActiveChange={onSpeechStateChange}
          disabled={disabled}
        />

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={disabled}
          className="p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy to clipboard"
        >
          📋
        </button>

        {/* Regenerate Button */}
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Regenerate response"
        >
          🔄
        </button>

        {/* Feedback Buttons */}
        <div className="border-l border-gray-300 pl-2 flex gap-1">
          <button
            onClick={() => handleFeedback("like")}
            disabled={disabled}
            className={`p-2 rounded-lg transition ${
              feedbackSent === "like"
                ? "bg-green-100 text-green-700"
                : "hover:bg-gray-200 text-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Helpful"
          >
            👍
          </button>
          <button
            onClick={() => handleFeedback("dislike")}
            disabled={disabled}
            className={`p-2 rounded-lg transition ${
              feedbackSent === "dislike"
                ? "bg-red-100 text-red-700"
                : "hover:bg-gray-200 text-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Not helpful"
          >
            👎
          </button>
        </div>
      </div>

      <Toast message={toastMessage} visible={showToast} />
    </>
  );
};

export default ResponseActionBar;
