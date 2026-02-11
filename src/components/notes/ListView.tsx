import { formatDistanceToNow } from "date-fns";
import { Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types";

interface ListViewProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function ListView({ notes, onSelectNote, onCreateNote }: ListViewProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <FileText className="h-12 w-12 text-white/20" strokeWidth={1.5} />
        <div className="text-center space-y-1">
          <p className="text-white/90 font-medium">No notes yet</p>
          <p className="text-white/40 text-sm">Get started by creating your first note</p>
        </div>
        <Button onClick={onCreateNote} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add note
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[14px] divide-y divide-white/[0.06]">
      {notes.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelectNote(note.id)}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 text-left",
            "hover:bg-white/[0.04] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            "first:rounded-t-[14px] last:rounded-b-[14px]"
          )}
        >
          <span className="text-base shrink-0">{note.metadata?.icon || "📄"}</span>
          <span className="flex-1 text-sm text-white/90 truncate">
            {note.title || "Untitled"}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
            {note.type}
          </Badge>
          <span className="text-xs text-white/30 shrink-0">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </button>
      ))}
      <button
        onClick={onCreateNote}
        className="flex items-center gap-2 w-full px-4 py-3 text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors text-sm last:rounded-b-[14px]"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        Add note
      </button>
    </div>
  );
}
