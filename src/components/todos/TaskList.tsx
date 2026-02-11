import { useState } from "react";
import { ChevronDown, ChevronRight, ListTodo, Calendar, CheckCircle2, Loader2 } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { CurrentSection } from "@/components/todos/CurrentSection";
import { UpcomingSection } from "@/components/todos/UpcomingSection";
import { PastSection } from "@/components/todos/PastSection";

interface CollapsibleSectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}

function CollapsibleSectionHeader({
  title,
  icon,
  count,
  isOpen,
  onToggle,
}: CollapsibleSectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-3 w-full text-left hover:glass-active rounded-lg transition-all duration-300 ease-apple"
    >
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-white/40" strokeWidth={1.5} />
      ) : (
        <ChevronRight className="w-4 h-4 text-white/40" strokeWidth={1.5} />
      )}
      <span className="text-white/50">{icon}</span>
      <span className="text-sm font-medium text-white/90">{title}</span>
      <span className="ml-auto text-xs text-white/30">{count}</span>
    </button>
  );
}

export function TaskList() {
  const { data: todos, isLoading } = useTodos();
  const [openSections, setOpenSections] = useState({
    current: true,
    upcoming: true,
    past: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  const allTodos = todos ?? [];
  const currentTodos = allTodos.filter((t) => t.list_type === "current");
  const scheduledTodos = allTodos.filter(
    (t) => t.list_type === "scheduled" || t.list_type === "unscheduled"
  );
  const completedTodos = allTodos.filter((t) => t.status === "complete");

  const currentActiveCount = currentTodos.filter(
    (t) => t.status === "active"
  ).length;
  const scheduledActiveCount = scheduledTodos.filter(
    (t) => t.status === "active"
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-page-title text-white/90">Tasks</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pb-6">
        <div className="space-y-1">
          {/* Current */}
          <div>
            <CollapsibleSectionHeader
              title="Current"
              icon={<ListTodo className="w-4 h-4" strokeWidth={1.5} />}
              count={currentActiveCount}
              isOpen={openSections.current}
              onToggle={() => toggleSection("current")}
            />
            {openSections.current && (
              <div className="pl-2">
                <CurrentSection todos={currentTodos} />
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div>
            <CollapsibleSectionHeader
              title="Upcoming"
              icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
              count={scheduledActiveCount}
              isOpen={openSections.upcoming}
              onToggle={() => toggleSection("upcoming")}
            />
            {openSections.upcoming && (
              <div className="pl-2">
                <UpcomingSection todos={scheduledTodos} />
              </div>
            )}
          </div>

          {/* Past */}
          <div>
            <CollapsibleSectionHeader
              title="Completed"
              icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />}
              count={completedTodos.length}
              isOpen={openSections.past}
              onToggle={() => toggleSection("past")}
            />
            {openSections.past && (
              <div className="pl-2">
                <PastSection todos={allTodos} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
