import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  FilePlus,
  Trash2,
  FileText,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "./RichTextEditor";
import { useNote, useNoteChildren, useUpdateNote, useDeleteNote, useCreateNote } from "@/hooks/use-notes";
import type { Note } from "@/types";

interface NoteEditorProps {
  noteId: string;
  sectionId: string;
  onBack: () => void;
  onSelectNote: (noteId: string) => void;
}

export function NoteEditor({ noteId, sectionId, onBack, onSelectNote }: NoteEditorProps) {
  const { data: note, isLoading } = useNote(noteId);
  const { data: children } = useNoteChildren(noteId);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createNote = useCreateNote();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setIcon(note.metadata?.icon || "");
    }
  }, [note]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        if (note && newTitle.trim()) {
          updateNote.mutate({ id: note.id, title: newTitle.trim() });
        }
      }, 500);
    },
    [note, updateNote]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (note) {
        updateNote.mutate({ id: note.id, content });
      }
    },
    [note, updateNote]
  );

  const handleIconClick = useCallback(() => {
    if (!note) return;
    const emojis = ["📝", "💡", "🎯", "📚", "🔥", "⭐", "🚀", "💎", "🌟", "📌", "🎨", "🔧", "📖", "🧠", "💪"];
    const current = note.metadata?.icon || "";
    const currentIndex = emojis.indexOf(current);
    const nextEmoji = emojis[(currentIndex + 1) % emojis.length];
    setIcon(nextEmoji);
    updateNote.mutate({
      id: note.id,
      metadata: { ...note.metadata, icon: nextEmoji },
    });
  }, [note, updateNote]);

  const handleAddSubPage = useCallback(async () => {
    if (!note) return;
    const created = await createNote.mutateAsync({
      section_id: sectionId,
      parent_id: note.id,
      title: "Untitled",
      type: "page",
    });
    onSelectNote(created.id);
  }, [note, sectionId, createNote, onSelectNote]);

  const handleDelete = useCallback(() => {
    if (!note) return;
    deleteNote.mutate(
      { id: note.id, section_id: note.section_id!, parent_id: note.parent_id },
      { onSuccess: () => onBack() }
    );
  }, [note, deleteNote, onBack]);

  useEffect(() => {
    return () => clearTimeout(titleTimerRef.current);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="h-6 w-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-white/40">Note not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4 text-white/50" strokeWidth={1.5} />
          </Button>
          <span className="text-xs text-white/40">
            Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-white/50" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleAddSubPage}>
              <FilePlus className="mr-2 h-4 w-4" />
              Add sub-page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-4">
        {/* Page Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleIconClick}
            className="text-3xl hover:scale-110 transition-transform mt-1 shrink-0"
            title="Change icon"
          >
            {icon || "📄"}
          </button>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-white/90 outline-none placeholder:text-white/30"
            placeholder="Untitled"
          />
        </div>

        {/* Editor */}
        <RichTextEditor
          content={note.content || ""}
          onChange={handleContentChange}
          placeholder="Start writing, or type '/' for commands..."
        />

        {/* Sub-pages */}
        {children && children.length > 0 && (
          <div className="pt-4 space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1 mb-2">
              Sub-pages
            </p>
            {children.map((child) => (
              <SubPageItem
                key={child.id}
                note={child}
                onClick={() => onSelectNote(child.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubPageItem({ note, onClick }: { note: Note; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
        "text-white/70 hover:bg-white/[0.04] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      )}
    >
      <FileText className="h-4 w-4 text-white/40 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-sm text-left truncate">
        {note.metadata?.icon ? `${note.metadata.icon} ` : ""}
        {note.title || "Untitled"}
      </span>
      <ChevronRight className="h-4 w-4 text-white/30 shrink-0" strokeWidth={1.5} />
    </button>
  );
}
