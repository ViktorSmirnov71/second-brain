import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTodo, useReorderTodos } from "@/hooks/use-todos";
import { TodoItem } from "@/components/todos/TodoItem";
import type { Todo } from "@/types";

interface SortableTodoProps {
  todo: Todo;
}

function SortableTodo({ todo }: SortableTodoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group/drag">
      <button
        className="flex-shrink-0 p-1 opacity-0 group-hover/drag:opacity-40 cursor-grab active:cursor-grabbing transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-white/40" strokeWidth={1.5} />
      </button>
      <div className="flex-1 min-w-0">
        <TodoItem todo={todo} isDragging={isDragging} />
      </div>
    </div>
  );
}

interface CurrentSectionProps {
  todos: Todo[];
}

export function CurrentSection({ todos }: CurrentSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const createTodo = useCreateTodo();
  const reorderTodos = useReorderTodos();

  const activeTodos = todos
    .filter((t) => t.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = () => {
    const title = inputValue.trim();
    if (!title) return;
    createTodo.mutate({ title, list_type: "current" });
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeTodos.findIndex((t) => t.id === active.id);
    const newIndex = activeTodos.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...activeTodos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const reorders = reordered.map((todo, index) => ({
      id: todo.id,
      sort_order: index,
    }));

    reorderTodos.mutate(reorders);
  };

  return (
    <div className="space-y-2">
      {/* Quick add input */}
      <div className="px-1">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className={cn(
            "w-full rounded-lg glass-surface px-3 py-2 text-sm text-white/90",
            "placeholder:text-white/40 outline-none",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "transition-all duration-300 ease-apple",
            "text-[16px] md:text-sm"
          )}
        />
      </div>

      {/* Sortable list */}
      {activeTodos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTodos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {activeTodos.map((todo) => (
                <SortableTodo key={todo.id} todo={todo} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="px-4 py-3 text-sm text-white/30">
          No current tasks. Type above to add one.
        </p>
      )}
    </div>
  );
}
