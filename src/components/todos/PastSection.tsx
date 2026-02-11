import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TodoItem } from "@/components/todos/TodoItem";
import type { Todo } from "@/types";

interface DayGroup {
  dateLabel: string;
  todos: Todo[];
  completedCount: number;
  totalCount: number;
}

function groupByCompletionDate(todos: Todo[]): DayGroup[] {
  const completed = todos
    .filter((t) => t.status === "complete" && t.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime()
    );

  const groups = new Map<string, Todo[]>();

  for (const todo of completed) {
    const dateKey = format(parseISO(todo.completed_at!), "yyyy-MM-dd");
    const existing = groups.get(dateKey) ?? [];
    existing.push(todo);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries()).map(([dateKey, dayTodos]) => ({
    dateLabel: format(parseISO(dateKey), "EEEE, MMM d"),
    todos: dayTodos,
    completedCount: dayTodos.length,
    totalCount: dayTodos.length,
  }));
}

interface CollapsibleDayGroupProps {
  group: DayGroup;
}

function CollapsibleDayGroup({ group }: CollapsibleDayGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 w-full text-left group hover:glass-active rounded-lg transition-all duration-300 ease-apple"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-white/40" strokeWidth={1.5} />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/40" strokeWidth={1.5} />
        )}
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {group.dateLabel}
        </span>
        <span className="text-xs text-white/30">
          {group.completedCount}/{group.totalCount} completed
        </span>
      </button>
      {isOpen && (
        <div className="ml-1 space-y-0.5 opacity-60">
          {group.todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PastSectionProps {
  todos: Todo[];
}

export function PastSection({ todos }: PastSectionProps) {
  const groups = groupByCompletionDate(todos);

  if (groups.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-white/30">
        No completed tasks yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <CollapsibleDayGroup key={group.dateLabel} group={group} />
      ))}
    </div>
  );
}
