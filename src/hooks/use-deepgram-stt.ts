import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface UseDeepgramSTTReturn {
  isConnected: boolean;
  isConnecting: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearTranscripts: () => void;
}

export function useDeepgramSTT(
  onFinalTranscript: (text: string) => void
): UseDeepgramSTTReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        // Send CloseStream message before closing
        wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Get WebSocket URL from Edge Function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/deepgram-stt-token`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get STT token");
      }

      const { websocketUrl, apiKey } = await response.json();

      // Connect WebSocket with API key in header
      const ws = new WebSocket(websocketUrl, ["token", apiKey]);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);

        // Set up AudioWorklet for audio processing
        try {
          const audioContext = new AudioContext({ sampleRate: 48000 });
          audioContextRef.current = audioContext;

          await audioContext.audioWorklet.addModule("/audio-worklet-processor.js");

          const source = audioContext.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(audioContext, "audio-processor");
          workletNodeRef.current = workletNode;

          workletNode.port.onmessage = (event) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };

          source.connect(workletNode);
          workletNode.connect(audioContext.destination);
        } catch (audioError) {
          console.error("AudioWorklet setup failed:", audioError);
          throw audioError;
        }

        // Send KeepAlive every 8 seconds
        keepAliveRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, 8000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "Results") {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (!transcript) return;

            if (data.is_final) {
              setFinalTranscript((prev) => {
                const updated = prev ? `${prev} ${transcript}` : transcript;
                return updated;
              });
              setInterimTranscript("");
            } else {
              setInterimTranscript(transcript);
            }
          } else if (data.type === "UtteranceEnd") {
            // Utterance complete — send accumulated final transcript
            setFinalTranscript((prev) => {
              if (prev.trim()) {
                onFinalTranscript(prev.trim());
              }
              return "";
            });
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("Voice connection error");
        cleanup();
      };

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          console.warn("WebSocket closed unexpectedly:", event.code, event.reason);
          setError("Voice connection lost");
        }
        cleanup();
      };
    } catch (err) {
      console.error("STT connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      cleanup();
    }
  }, [isConnected, isConnecting, onFinalTranscript, cleanup]);

  const disconnect = useCallback(() => {
    // Flush any remaining transcript
    setFinalTranscript((prev) => {
      if (prev.trim()) {
        onFinalTranscript(prev.trim());
      }
      return "";
    });
    cleanup();
  }, [cleanup, onFinalTranscript]);

  const clearTranscripts = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
  }, []);

  return {
    isConnected,
    isConnecting,
    interimTranscript,
    finalTranscript,
    error,
    connect,
    disconnect,
    clearTranscripts,
  };
}
