import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { StreamingIndicator } from "./StreamingIndicator";
import { VoiceTranscriptBubble } from "./VoiceTranscriptBubble";
import { WelcomeMessage } from "./WelcomeMessage";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  voiceActive?: boolean;
  interimTranscript?: string;
}

export function ChatMessages({ messages, isStreaming, voiceActive, interimTranscript }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, interimTranscript]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 && <WelcomeMessage />}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isStreaming && <StreamingIndicator />}
        {voiceActive && interimTranscript && (
          <VoiceTranscriptBubble transcript={interimTranscript} />
        )}
      </div>
    </div>
  );
}
