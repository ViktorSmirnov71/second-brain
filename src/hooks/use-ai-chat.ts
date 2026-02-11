import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

interface SendMessageOptions {
  overrideConversationId?: string;
  inputMode?: "voice" | "text";
}

interface UseAIChatOptions {
  onSentence?: (sentence: string) => void;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  lastAssistantMessage: string | null;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useAIChat(conversationId: string | null, opts?: UseAIChatOptions): UseAIChatReturn {
  const onSentenceRef = useRef(opts?.onSentence);
  onSentenceRef.current = opts?.onSentence;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string | null>(null);
  const messageIdCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateId = useCallback(() => {
    messageIdCounter.current += 1;
    return `local-${Date.now()}-${messageIdCounter.current}`;
  }, []);

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!content.trim() || isStreaming) return;

      const effectiveConversationId = options?.overrideConversationId || conversationId;

      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        conversation_id: effectiveConversationId || "",
        role: "user",
        content: content.trim(),
        tool_calls: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantId = generateId();
      let fullText = "";

      // Add empty assistant message that we'll stream into
      const assistantMessage: ChatMessage = {
        id: assistantId,
        conversation_id: conversationId || "",
        role: "assistant",
        content: "",
        tool_calls: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversationId: effectiveConversationId,
              message: content.trim(),
              inputMode: options?.inputMode,
            }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let sentenceBuffer = "";
        const isVoice = options?.inputMode === "voice";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            try {
              const event = JSON.parse(data);

              if (event.type === "text_delta") {
                fullText += event.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullText }
                      : msg
                  )
                );

                // Sentence boundary detection for chunked TTS
                if (isVoice && onSentenceRef.current) {
                  sentenceBuffer += event.text;
                  // Split on sentence-ending punctuation followed by whitespace
                  const sentenceMatch = sentenceBuffer.match(/^(.*?[.!?])\s+(.*)$/s);
                  if (sentenceMatch) {
                    onSentenceRef.current(sentenceMatch[1]);
                    sentenceBuffer = sentenceMatch[2];
                  }
                }
              } else if (event.type === "done") {
                fullText = event.text || fullText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullText }
                      : msg
                  )
                );

                // Flush remaining sentence buffer
                if (isVoice && onSentenceRef.current && sentenceBuffer.trim()) {
                  onSentenceRef.current(sentenceBuffer.trim());
                  sentenceBuffer = "";
                }
              } else if (event.type === "tool_start") {
                // Tool use started — could show indicator
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (parseError) {
              // Skip unparseable events
              if (parseError instanceof Error && parseError.message !== data) {
                throw parseError;
              }
            }
          }
        }

        // Flush any remaining sentence buffer at end of stream
        if (isVoice && onSentenceRef.current && sentenceBuffer.trim()) {
          onSentenceRef.current(sentenceBuffer.trim());
        }

        setLastAssistantMessage(fullText);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Intentional abort, don't show error
          return;
        }

        console.error("Chat error:", err);
        const errorText = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `Sorry, I encountered an error: ${errorText}` }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming, generateId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastAssistantMessage(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isStreaming,
    lastAssistantMessage,
    sendMessage,
    clearMessages,
    setMessages,
  };
}
