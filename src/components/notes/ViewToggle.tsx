import { Grid3X3, Columns3, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section } from "@/types";

interface ViewToggleProps {
  viewType: Section["view_type"];
  onChange: (viewType: Section["view_type"]) => void;
}

const views: { type: Section["view_type"]; icon: typeof Grid3X3; label: string }[] = [
  { type: "hierarchy", icon: Grid3X3, label: "Hierarchy" },
  { type: "kanban", icon: Columns3, label: "Kanban" },
  { type: "list", icon: List, label: "List" },
  { type: "gallery", icon: LayoutGrid, label: "Gallery" },
];

export function ViewToggle({ viewType, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 glass-surface rounded-lg p-0.5">
      {views.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          title={label}
          className={cn(
            "p-1.5 rounded-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            viewType === type
              ? "bg-white/[0.08] text-white/90"
              : "text-white/40 hover:text-white/70"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
