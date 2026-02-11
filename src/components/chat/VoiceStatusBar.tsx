import { cn } from "@/lib/utils";

export type VoiceStatus = "listening" | "hearing" | "speaking" | "thinking";

interface VoiceStatusBarProps {
  status: VoiceStatus;
  interimTranscript?: string;
}

const statusConfig: Record<
  VoiceStatus,
  { label: string; dotClass: string }
> = {
  listening: {
    label: "Listening...",
    dotClass: "bg-emerald-400 animate-pulse",
  },
  hearing: {
    label: "Hearing you...",
    dotClass: "bg-blue-400 animate-pulse",
  },
  speaking: {
    label: "Speaking...",
    dotClass: "bg-purple-400 animate-pulse",
  },
  thinking: {
    label: "Thinking...",
    dotClass: "bg-white/40 animate-pulse",
  },
};

export function VoiceStatusBar({ status, interimTranscript }: VoiceStatusBarProps) {
  const config = statusConfig[status];

  return (
    <div className="glass-surface border-b border-white/[0.06] px-4 py-2 flex items-center gap-2">
      <span
        className={cn("w-2 h-2 rounded-full flex-shrink-0", config.dotClass)}
      />
      <span className="text-xs text-white/50">
        {status === "hearing" && interimTranscript
          ? interimTranscript
          : config.label}
      </span>
      {status === "thinking" && (
        <div className="flex-1 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div className="h-full w-1/3 bg-white/10 rounded-full animate-shimmer" />
        </div>
      )}
    </div>
  );
}
