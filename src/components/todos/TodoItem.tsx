import { useState, useRef } from "react";
import { Check, Calendar, Trash2, ArrowRight, Pencil } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { useUpdateTodo, useDeleteTodo } from "@/hooks/use-todos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Todo } from "@/types";

interface TodoItemProps {
  todo: Todo;
  isDragging?: boolean;
}

export function TodoItem({ todo, isDragging }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isComplete = todo.status === "complete";

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      status: isComplete ? "active" : "complete",
    });
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== todo.title) {
      updateTodo.mutate({ id: todo.id, title: trimmed });
    } else {
      setEditValue(todo.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditValue(todo.title);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(todo.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleMoveTo = (listType: Todo["list_type"]) => {
    updateTodo.mutate({ id: todo.id, list_type: listType });
  };

  const dateBadgeColor = () => {
    if (!todo.date) return "";
    const d = new Date(todo.date);
    if (isPast(d) && !isToday(d)) return "text-red-400";
    if (isToday(d) || isTomorrow(d)) return "text-amber-400";
    return "text-white/40";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-apple cursor-default select-none",
            "hover:glass-active",
            isDragging && "glass-active opacity-80",
            isComplete && "opacity-60"
          )}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded-full border transition-all duration-300 ease-apple flex items-center justify-center",
              isComplete
                ? "border-emerald-500/60 bg-emerald-500/20"
                : "border-white/20 hover:border-white/40"
            )}
          >
            {isComplete && (
              <Check className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
            )}
          </button>

          {/* Title */}
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-white/90 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "flex-1 text-sm transition-all duration-300",
                isComplete
                  ? "line-through text-white/30"
                  : "text-white/70"
              )}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
            >
              {todo.title}
            </span>
          )}

          {/* Date badge */}
          {todo.date && !isEditing && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs flex-shrink-0",
                dateBadgeColor()
              )}
            >
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              {format(new Date(todo.date), "MMM d")}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={startEditing}>
          <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {todo.list_type !== "current" && (
          <DropdownMenuItem onClick={() => handleMoveTo("current")}>
            <ArrowRight className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Move to Current
          </DropdownMenuItem>
        )}
        {todo.list_type !== "scheduled" && (
          <DropdownMenuItem onClick={() => handleMoveTo("scheduled")}>
            <Calendar className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Move to Scheduled
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => deleteTodo.mutate(todo.id)}
          className="text-red-400 focus:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
