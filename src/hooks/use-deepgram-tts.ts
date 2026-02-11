import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface UseDeepgramTTSReturn {
  isSpeaking: boolean;
  speak: (text: string, voiceId?: string) => Promise<void>;
  speakChunk: (text: string, voiceId?: string) => void;
  stop: () => void;
  error: string | null;
}

export function useDeepgramTTS(): UseDeepgramTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const stoppedRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const synthesizeAndPlay = useCallback(
    async (text: string, voiceId?: string): Promise<void> => {
      if (!text.trim() || stoppedRef.current) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/deepgram-tts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, voiceId }),
          }
        );

        if (!response.ok) {
          throw new Error("TTS synthesis failed");
        }

        if (stoppedRef.current) return;

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            cleanupAudio();
            resolve();
          };
          audio.onerror = () => {
            setError("Audio playback failed");
            cleanupAudio();
            reject(new Error("Audio playback failed"));
          };
          audio.play().catch(reject);
        });
      } catch (err) {
        if (stoppedRef.current) return;
        console.error("TTS error:", err);
        setError(err instanceof Error ? err.message : "TTS failed");
      }
    },
    [cleanupAudio]
  );

  const processQueue = useCallback(
    async (voiceId?: string) => {
      if (isProcessingQueueRef.current) return;
      isProcessingQueueRef.current = true;
      setIsSpeaking(true);

      while (queueRef.current.length > 0 && !stoppedRef.current) {
        const chunk = queueRef.current.shift()!;
        await synthesizeAndPlay(chunk, voiceId);
      }

      isProcessingQueueRef.current = false;
      if (!stoppedRef.current) {
        setIsSpeaking(false);
      }
    },
    [synthesizeAndPlay]
  );

  const speak = useCallback(
    async (text: string, voiceId?: string) => {
      if (!text.trim()) return;

      stoppedRef.current = false;
      queueRef.current = [];
      cleanupAudio();
      setError(null);
      setIsSpeaking(true);

      await synthesizeAndPlay(text, voiceId);
      setIsSpeaking(false);
    },
    [cleanupAudio, synthesizeAndPlay]
  );

  const speakChunk = useCallback(
    (text: string, voiceId?: string) => {
      if (!text.trim() || stoppedRef.current) return;

      setError(null);
      queueRef.current.push(text);
      processQueue(voiceId);
    },
    [processQueue]
  );

  const stop = useCallback(() => {
    stoppedRef.current = true;
    queueRef.current = [];
    isProcessingQueueRef.current = false;
    cleanupAudio();
    setIsSpeaking(false);
  }, [cleanupAudio]);

  return {
    isSpeaking,
    speak,
    speakChunk,
    stop,
    error,
  };
}
