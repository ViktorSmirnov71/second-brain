import { formatDistanceToNow } from "date-fns";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types";

interface GalleryViewProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function GalleryView({ notes, onSelectNote, onCreateNote }: GalleryViewProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelectNote(note.id)}
          className="glass-panel rounded-[14px] p-4 text-left hover:bg-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{note.metadata?.icon || "📄"}</span>
            <span className="text-sm font-medium text-white/90 truncate flex-1">
              {note.title || "Untitled"}
            </span>
          </div>

          {note.content && (
            <p className="text-xs text-white/40 line-clamp-3">
              {stripHtml(note.content)}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {note.type}
            </Badge>
            <span className="text-[10px] text-white/30">
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </span>
          </div>
        </button>
      ))}

      <button
        onClick={onCreateNote}
        className="glass-panel rounded-[14px] p-4 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] min-h-[120px]"
      >
        <Plus className="h-8 w-8" strokeWidth={1.5} />
        <span className="text-sm">Add note</span>
      </button>
    </div>
  );
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
