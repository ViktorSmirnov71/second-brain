import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Diamond,
  Calendar,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoadmapTask } from "@/types";

interface TimelineViewProps {
  tasks: RoadmapTask[];
  onToggleComplete: (task: RoadmapTask) => void;
  onEditTask: (task: RoadmapTask) => void;
  onAddTask: () => void;
}

export function TimelineView({
  tasks,
  onToggleComplete,
  onEditTask,
  onAddTask,
}: TimelineViewProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Calendar className="h-12 w-12 text-white/20" />
            <div className="text-center space-y-1">
              <p className="text-white/90 font-medium">No tasks yet</p>
              <p className="text-white/40 text-sm">
                Add tasks to build your timeline
              </p>
            </div>
            <Button onClick={onAddTask} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        ) : (
          <>
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:bg-white/[0.04] cursor-pointer"
                onClick={() => onEditTask(task)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task);
                  }}
                  className="mt-0.5 shrink-0"
                  aria-label={
                    task.is_completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/30 hover:text-white/50 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {task.is_milestone && (
                      <Diamond className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        task.is_completed
                          ? "text-white/40 line-through"
                          : "text-white/90"
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/40">
                      {format(new Date(task.start_date), "MMM d")} -{" "}
                      {format(new Date(task.end_date), "MMM d")}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {task.duration}d
                    </Badge>
                  </div>
                </div>

                <span className="text-xs text-white/30 shrink-0 mt-1">
                  #{index + 1}
                </span>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={onAddTask}
              className="w-full mt-2 text-white/40 hover:text-white/70"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <button
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors w-full"
        >
          <Sparkles className="h-4 w-4" />
          <span>Amend with AI</span>
          {aiPanelOpen ? (
            <ChevronDown className="h-3 w-3 ml-auto" />
          ) : (
            <ChevronRight className="h-3 w-3 ml-auto" />
          )}
        </button>

        {aiPanelOpen && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Describe changes to the roadmap..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!aiPrompt.trim()}
              onClick={() => {
                setAiPrompt("");
              }}
            >
              Apply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
