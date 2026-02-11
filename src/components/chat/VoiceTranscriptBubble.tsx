import { cn } from "@/lib/utils";

interface VoiceTranscriptBubbleProps {
  transcript: string;
}

export function VoiceTranscriptBubble({ transcript }: VoiceTranscriptBubbleProps) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          "bg-white/[0.06] border border-white/[0.08]",
          "text-sm text-white/50 italic"
        )}
      >
        {transcript || (
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
}
