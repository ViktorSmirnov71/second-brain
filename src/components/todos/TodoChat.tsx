import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTodo } from "@/hooks/use-todos";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function TodoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can help you manage your tasks. Tell me what you need to do, or ask me anything about your tasks.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createTodo = useCreateTodo();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setInputValue("");

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Determine response
    const isQuestion = text.includes("?");
    let responseContent: string;

    if (isQuestion) {
      responseContent =
        "I can help with that! (AI integration coming soon)";
    } else {
      // Create a task from the message
      createTodo.mutate({ title: text, list_type: "current" });
      responseContent = `Added task: ${text}`;
    }

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: responseContent,
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage, assistantMessage];
      // Keep last 15 messages (plus welcome)
      if (updated.length > 16) {
        return updated.slice(updated.length - 16);
      }
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
          Task Chat
        </h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pb-4 space-y-3"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-primary/20"
                  : "bg-white/[0.06]"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              ) : (
                <Bot className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "glass-active text-white/90"
                  : "glass-surface text-white/70"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 glass-surface rounded-xl px-3 py-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a task or ask a question..."
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/40",
              "outline-none resize-none min-h-[24px] max-h-[120px]",
              "text-[16px] md:text-sm"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-lg transition-all duration-300 ease-apple",
              inputValue.trim()
                ? "text-primary hover:glass-active"
                : "text-white/20 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
