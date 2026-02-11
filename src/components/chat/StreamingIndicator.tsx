import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamingIndicatorProps {
  isWaiting?: boolean;
}

export function StreamingIndicator({ isWaiting = true }: StreamingIndicatorProps) {
  return (
    <div className="flex gap-3 max-w-[80%] animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="glass-panel rounded-2xl rounded-bl-md px-4 py-3">
        {isWaiting ? (
          <div className="flex items-center gap-1.5 h-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full bg-white/40",
                  "animate-bounce"
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : (
          <span className="inline-block w-0.5 h-4 bg-white/70 animate-pulse" />
        )}
      </div>
    </div>
  );
}
