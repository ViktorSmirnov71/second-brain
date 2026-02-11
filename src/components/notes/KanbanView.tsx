import { useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/types";

const DEFAULT_COLUMNS = ["New", "Exploring", "On Hold", "Done"];

interface KanbanViewProps {
  notes: Note[];
  columns?: string[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (status?: string) => void;
  onMoveNote: (noteId: string, status: string, sortOrder: number) => void;
}

export function KanbanView({
  notes,
  columns = DEFAULT_COLUMNS,
  onSelectNote,
  onCreateNote,
  onMoveNote,
}: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columnNotes = useMemo(() => {
    const map: Record<string, Note[]> = {};
    columns.forEach((col) => {
      map[col] = [];
    });
    notes.forEach((note) => {
      const status = note.status || columns[0];
      if (map[status]) {
        map[status].push(note);
      } else {
        map[columns[0]].push(note);
      }
    });
    return map;
  }, [notes, columns]);

  const activeNote = activeId ? notes.find((n) => n.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const noteId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    let targetColumn: string | undefined;
    let targetIndex = 0;

    // Check if dropped on a column
    if (columns.includes(overId)) {
      targetColumn = overId;
      targetIndex = columnNotes[overId].length;
    } else {
      // Dropped on another card — find its column
      for (const col of columns) {
        const idx = columnNotes[col].findIndex((n) => n.id === overId);
        if (idx !== -1) {
          targetColumn = col;
          targetIndex = idx;
          break;
        }
      }
    }

    if (targetColumn) {
      onMoveNote(noteId, targetColumn, targetIndex);
    }
  };

  if (notes.length === 0 && columns.length > 0) {
    // Still show columns even when empty
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-0 flex-1">
        {columns.map((column) => (
          <KanbanColumn
            key={column}
            title={column}
            notes={columnNotes[column] || []}
            onSelectNote={onSelectNote}
            onAddCard={() => onCreateNote(column)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeNote ? <KanbanCardOverlay note={activeNote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  title,
  notes,
  onSelectNote,
  onAddCard,
}: {
  title: string;
  notes: Note[];
  onSelectNote: (noteId: string) => void;
  onAddCard: () => void;
}) {
  const noteIds = useMemo(() => notes.map((n) => n.id), [notes]);

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">{title}</span>
          <span className="text-xs text-white/30">{notes.length}</span>
        </div>
        <button
          onClick={onAddCard}
          className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <SortableContext items={noteIds} strategy={verticalListSortingStrategy} id={title}>
        <div className="flex-1 min-h-[100px] space-y-2">
          {notes.map((note) => (
            <SortableKanbanCard
              key={note.id}
              note={note}
              onClick={() => onSelectNote(note.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableKanbanCard({ note, onClick }: { note: Note; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "glass-panel rounded-lg p-3 cursor-pointer hover:bg-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{note.metadata?.icon || "📄"}</span>
        <span className="text-sm font-medium text-white/90 truncate">
          {note.title || "Untitled"}
        </span>
      </div>
      {note.content && (
        <p className="text-xs text-white/40 line-clamp-2 mt-1">
          {stripHtml(note.content)}
        </p>
      )}
    </div>
  );
}

function KanbanCardOverlay({ note }: { note: Note }) {
  return (
    <div className="glass-popover rounded-lg p-3 shadow-2xl w-64">
      <div className="flex items-center gap-2">
        <span className="text-sm">{note.metadata?.icon || "📄"}</span>
        <span className="text-sm font-medium text-white/90 truncate">
          {note.title || "Untitled"}
        </span>
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
