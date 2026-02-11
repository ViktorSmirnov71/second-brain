import { Bot, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center animate-fade-in">
        <div className="glass-surface rounded-full px-3 py-1.5 flex items-center gap-2">
          <Info className="h-3 w-3 text-white/40" />
          <span className="text-xs text-white/40">{message.content}</span>
          <span className="text-xs text-white/30">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[80%] animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="glass-panel rounded-2xl rounded-bl-md px-4 py-2.5 min-w-0">
        <div
          className={cn(
            "text-sm text-white/70 prose prose-invert prose-sm max-w-none",
            "prose-p:my-1 prose-headings:text-white/90 prose-headings:mt-3 prose-headings:mb-1",
            "prose-code:text-primary prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded",
            "prose-pre:glass-surface prose-pre:rounded-lg",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-white/90",
            "prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-white/70 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
