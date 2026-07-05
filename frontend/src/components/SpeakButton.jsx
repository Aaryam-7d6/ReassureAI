import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, PauseCircle, PlayCircle } from "lucide-react";

const normalizeTextForSpeech = (text = "") =>
  String(text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

const getPreferredVoice = (text, voices = []) => {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);

  if (hasDevanagari) {
    return (
      voices.find((voice) => voice.lang === "hi-IN") ||
      voices.find((voice) => voice.lang.startsWith("hi")) ||
      null
    );
  }

  return (
    voices.find((voice) => voice.lang === "en-IN") ||
    voices.find((voice) => voice.lang === "en-US") ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    null
  );
};

export default function SpeakButton({
  text,
  messageId,
  activeMessageId,
  onActiveChange,
  disabled = false,
  className = "",
}) {
  const [status, setStatus] = useState("idle");
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);

  const supportsSpeech =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const isActive = activeMessageId === messageId;

  useEffect(() => {
    if (!supportsSpeech) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();

    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }

    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supportsSpeech]);

  useEffect(() => {
    if (!isActive && status !== "idle") {
      setStatus("idle");
    }
  }, [isActive, status]);

  useEffect(() => {
    return () => {
      if (supportsSpeech && utteranceRef.current && status !== "idle") {
        window.speechSynthesis.cancel();
      }
    };
  }, [supportsSpeech, status]);

  const handleToggle = () => {
    if (!supportsSpeech || disabled || !text?.trim()) return;

    const speech = window.speechSynthesis;
    const plainText = normalizeTextForSpeech(text);

    if (!plainText) return;

    if (status === "speaking") {
      speech.pause();
      setStatus("paused");
      return;
    }

    if (status === "paused") {
      speech.resume();
      setStatus("speaking");
      return;
    }

    if (activeMessageId && activeMessageId !== messageId) {
      speech.cancel();
    }

    onActiveChange?.(messageId);
    speech.cancel();

    const utterance = new SpeechSynthesisUtterance(plainText);
    const voice = getPreferredVoice(plainText, voices);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else if (/[^\u0000-\u007F]/.test(plainText)) {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setStatus("idle");
      if (activeMessageId === messageId) {
        onActiveChange?.(null);
      }
    };

    utterance.onerror = () => {
      setStatus("idle");
      if (activeMessageId === messageId) {
        onActiveChange?.(null);
      }
    };

    utterance.onpause = () => setStatus("paused");
    utterance.onresume = () => setStatus("speaking");

    utteranceRef.current = utterance;
    setStatus("speaking");
    speech.speak(utterance);
  };

  if (!supportsSpeech) return null;

  const iconProps = {
    className: "w-4 h-4",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      aria-label={
        status === "speaking"
          ? "Pause speech"
          : status === "paused"
            ? "Resume speech"
            : "Read aloud"
      }
      title={
        status === "speaking"
          ? "Pause speech"
          : status === "paused"
            ? "Resume speech"
            : "Read aloud"
      }
      className={`p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
        status === "speaking"
          ? "bg-emerald-100 text-emerald-700"
          : status === "paused"
            ? "bg-amber-100 text-amber-700"
            : "hover:bg-gray-200 text-gray-600"
      } ${className}`.trim()}
    >
      {status === "speaking" ? (
        <PauseCircle {...iconProps} />
      ) : status === "paused" ? (
        <PlayCircle {...iconProps} />
      ) : (
        <Volume2 {...iconProps} />
      )}
    </button>
  );
}
