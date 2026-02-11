import { Users, FileText, ListTodo, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type ExecutionType = "person" | "note" | "task" | "roadmap";

interface ExecutionResultCardProps {
  type: ExecutionType;
  action: string;
  title: string;
  onClick?: () => void;
}

const typeConfig: Record<
  ExecutionType,
  { icon: typeof Users; color: string; bg: string }
> = {
  person: {
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  note: {
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  task: {
    icon: ListTodo,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  roadmap: {
    icon: MapPin,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
};

export function ExecutionResultCard({
  type,
  action,
  title,
  onClick,
}: ExecutionResultCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-surface rounded-lg px-3 py-2.5 flex items-center gap-3 w-full text-left",
        "transition-all duration-300 ease-apple hover:glass-active",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/40">{action}</p>
        <p className="text-sm text-white/90 truncate">{title}</p>
      </div>
    </button>
  );
}
