import { useState, useCallback, useEffect, useRef } from "react";
import { useDeepgramSTT } from "./use-deepgram-stt";
import { useDeepgramTTS } from "./use-deepgram-tts";
import { stripMarkdownForSpeech } from "@/lib/utils";

export type VoiceSessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "userSpeaking"
  | "processing"
  | "aiSpeaking";

interface UseVoiceSessionProps {
  sendMessage: (content: string, options?: { overrideConversationId?: string; inputMode?: "voice" | "text" }) => Promise<void>;
  isStreaming: boolean;
  lastAssistantMessage: string | null;
}

interface UseVoiceSessionReturn {
  sessionState: VoiceSessionState;
  interimTranscript: string;
  startSession: () => void;
  endSession: () => void;
  error: string | null;
  handleSentenceChunk: (sentence: string) => void;
}

export function useVoiceSession({
  sendMessage,
  isStreaming,
  lastAssistantMessage,
}: UseVoiceSessionProps): UseVoiceSessionReturn {
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastSpokenRef = useRef<string | null>(null);
  const sessionActiveRef = useRef(false);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!sessionActiveRef.current) return;
      setSessionState("processing");
      sendMessage(text, { inputMode: "voice" });
    },
    [sendMessage]
  );

  const stt = useDeepgramSTT(handleFinalTranscript);
  const tts = useDeepgramTTS();
  const chunkedSpeechActiveRef = useRef(false);

  // Called by useAIChat when a complete sentence is detected during streaming
  const handleSentenceChunk = useCallback(
    (sentence: string) => {
      if (!sessionActiveRef.current) return;
      const cleaned = stripMarkdownForSpeech(sentence);
      if (!cleaned.trim()) return;

      if (sessionState === "processing") {
        setSessionState("aiSpeaking");
      }
      chunkedSpeechActiveRef.current = true;
      tts.speakChunk(cleaned);
    },
    [sessionState, tts]
  );

  // Track STT connection state
  useEffect(() => {
    if (stt.isConnecting) {
      setSessionState("connecting");
    } else if (stt.isConnected && sessionActiveRef.current) {
      if (sessionState === "connecting") {
        setSessionState("listening");
      }
    }
  }, [stt.isConnecting, stt.isConnected, sessionState]);

  // Track user speaking (interim transcripts appearing) + barge-in support
  useEffect(() => {
    if (!stt.interimTranscript || !sessionActiveRef.current) return;

    if (sessionState === "listening" || sessionState === "userSpeaking") {
      setSessionState("userSpeaking");
    } else if (sessionState === "aiSpeaking") {
      // Barge-in: user started speaking while AI is talking — stop TTS
      tts.stop();
      setSessionState("userSpeaking");
    }
  }, [stt.interimTranscript, sessionState, tts]);

  // Track AI streaming → processing state
  useEffect(() => {
    if (isStreaming && sessionActiveRef.current) {
      setSessionState("processing");
    }
  }, [isStreaming]);

  // When AI response completes, speak it via TTS (fallback if chunked speech wasn't used)
  useEffect(() => {
    if (
      !isStreaming &&
      lastAssistantMessage &&
      lastAssistantMessage !== lastSpokenRef.current &&
      sessionActiveRef.current &&
      (sessionState === "processing" || sessionState === "aiSpeaking")
    ) {
      lastSpokenRef.current = lastAssistantMessage;

      // If chunked speech was active, sentences were already queued — don't re-speak
      if (chunkedSpeechActiveRef.current) {
        chunkedSpeechActiveRef.current = false;
        // aiSpeaking state is already set by handleSentenceChunk;
        // TTS will finish and the isSpeaking effect will transition to listening
        return;
      }

      // Fallback: speak the full response if no chunked speech happened
      setSessionState("aiSpeaking");
      tts.speak(stripMarkdownForSpeech(lastAssistantMessage));
    }
  }, [isStreaming, lastAssistantMessage, sessionState, tts]);

  // When TTS finishes speaking, return to listening
  useEffect(() => {
    if (
      !tts.isSpeaking &&
      sessionState === "aiSpeaking" &&
      sessionActiveRef.current
    ) {
      setSessionState("listening");
    }
  }, [tts.isSpeaking, sessionState]);

  // Aggregate errors
  useEffect(() => {
    const sttError = stt.error;
    const ttsError = tts.error;
    if (sttError) setError(sttError);
    else if (ttsError) setError(ttsError);
    else setError(null);
  }, [stt.error, tts.error]);

  const startSession = useCallback(() => {
    if (sessionState !== "idle") return;
    sessionActiveRef.current = true;
    setError(null);
    stt.connect();
  }, [sessionState, stt]);

  const endSession = useCallback(() => {
    sessionActiveRef.current = false;
    tts.stop();
    stt.disconnect();
    stt.clearTranscripts();
    setSessionState("idle");
    setError(null);
  }, [stt, tts]);

  return {
    sessionState,
    interimTranscript: stt.interimTranscript,
    startSession,
    endSession,
    error,
    handleSentenceChunk,
  };
}
