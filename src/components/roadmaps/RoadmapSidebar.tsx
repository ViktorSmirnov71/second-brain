import { Plus, Map, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Roadmap } from "@/types";

interface RoadmapSidebarProps {
  roadmaps: Roadmap[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  loading: boolean;
}

export function RoadmapSidebar({
  roadmaps,
  selectedId,
  onSelect,
  onCreateNew,
  loading,
}: RoadmapSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white/90">Roadmaps</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateNew}
          className="h-8 w-8"
          aria-label="New roadmap"
        >
          <Plus className="h-4 w-4 text-white/50" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg glass-surface animate-pulse"
              />
            ))}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Map className="h-10 w-10 text-white/20" />
            <p className="text-sm text-white/40 text-center px-4">
              No roadmaps yet
            </p>
          </div>
        ) : (
          roadmaps.map((roadmap) => (
            <button
              key={roadmap.id}
              onClick={() => onSelect(roadmap.id)}
              className={cn(
                "w-full text-left rounded-lg p-3 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                selectedId === roadmap.id
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/70 hover:bg-white/[0.04]"
              )}
            >
              <p className="text-sm font-medium truncate">{roadmap.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="h-3 w-3 text-white/40" />
                <span className="text-xs text-white/40">
                  {format(new Date(roadmap.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
