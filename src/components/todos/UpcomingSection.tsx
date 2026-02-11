import { useState } from "react";
import {
  isToday,
  isTomorrow,
  isThisWeek,
  startOfWeek,
  addWeeks,
  endOfWeek,
  format,
  isWithinInterval,
  compareAsc,
} from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

import { TodoItem } from "@/components/todos/TodoItem";
import type { Todo } from "@/types";

interface TodoGroup {
  label: string;
  todos: Todo[];
}

function groupUpcomingTodos(todos: Todo[]): TodoGroup[] {
  const active = todos.filter((t) => t.status === "active");

  const today: Todo[] = [];
  const tomorrow: Todo[] = [];
  const thisWeekByDay: Map<string, Todo[]> = new Map();
  const nextWeek: Todo[] = [];
  const later: Todo[] = [];
  const unscheduled: Todo[] = [];

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(weekStart, 1);
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

  for (const todo of active) {
    if (!todo.date) {
      unscheduled.push(todo);
      continue;
    }

    const d = new Date(todo.date);

    if (isToday(d)) {
      today.push(todo);
    } else if (isTomorrow(d)) {
      tomorrow.push(todo);
    } else if (isThisWeek(d, { weekStartsOn: 1 }) && compareAsc(d, now) > 0) {
      const dayName = format(d, "EEEE");
      const existing = thisWeekByDay.get(dayName) ?? [];
      existing.push(todo);
      thisWeekByDay.set(dayName, existing);
    } else if (
      isWithinInterval(d, { start: nextWeekStart, end: nextWeekEnd })
    ) {
      nextWeek.push(todo);
    } else if (compareAsc(d, now) > 0) {
      later.push(todo);
    } else {
      // Past due but still active — show in today
      today.push(todo);
    }
  }

  const groups: TodoGroup[] = [];

  if (today.length > 0) groups.push({ label: "Today", todos: today });
  if (tomorrow.length > 0) groups.push({ label: "Tomorrow", todos: tomorrow });

  // Sort this-week days chronologically
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const sortedDays = [...thisWeekByDay.entries()].sort(
    ([a], [b]) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
  );
  for (const [dayName, dayTodos] of sortedDays) {
    groups.push({ label: dayName, todos: dayTodos });
  }

  if (nextWeek.length > 0) groups.push({ label: "Next Week", todos: nextWeek });
  if (later.length > 0) groups.push({ label: "Later", todos: later });
  if (unscheduled.length > 0)
    groups.push({ label: "Unscheduled", todos: unscheduled });

  return groups;
}

interface CollapsibleGroupProps {
  label: string;
  count: number;
  children: React.ReactNode;
}

function CollapsibleGroup({ label, count, children }: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

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
          {label}
        </span>
        <span className="text-xs text-white/30">{count}</span>
      </button>
      {isOpen && <div className="ml-1 space-y-0.5">{children}</div>}
    </div>
  );
}

interface UpcomingSectionProps {
  todos: Todo[];
}

export function UpcomingSection({ todos }: UpcomingSectionProps) {
  const groups = groupUpcomingTodos(todos);

  if (groups.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-white/30">
        No upcoming tasks.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <CollapsibleGroup
          key={group.label}
          label={group.label}
          count={group.todos.length}
        >
          {group.todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </CollapsibleGroup>
      ))}
    </div>
  );
}
