import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUp, Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onMicClick?: () => void;
}

export function ChatInput({ onSend, isStreaming, onMicClick }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="glass-surface rounded-2xl flex items-end gap-2 px-3 py-2">
          <button
            type="button"
            onClick={onMicClick}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple mb-0.5"
            aria-label="Start voice input"
          >
            <Mic className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/40",
              "resize-none outline-none min-h-[36px] max-h-[150px] py-2",
              "text-[16px] md:text-sm"
            )}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isStreaming}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
              "transition-all duration-300 ease-apple mb-0.5",
              value.trim() && !isStreaming
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/10 text-white/30"
            )}
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
