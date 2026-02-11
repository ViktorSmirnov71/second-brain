import { useState } from "react";
import { Plus, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionItem } from "./SectionItem";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useNotes,
} from "@/hooks/use-notes";
import type { Section } from "@/types";

interface NotesSidebarProps {
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
}

export function NotesSidebar({
  activeSectionId,
  onSelectSection,
  activeNoteId,
  onSelectNote,
}: NotesSidebarProps) {
  const { data: sections, isLoading } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const handleCreateSection = () => {
    const name = newSectionName.trim();
    if (!name) return;

    createSection.mutate(
      { name, view_type: "list" },
      {
        onSuccess: () => {
          setNewSectionName("");
          setIsAddingSection(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass-panel border-r border-white/[0.06]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white/90">Notes</h2>
      </div>

      {/* Sections list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5">
        {sections?.map((section) => (
          <SectionWithNotes
            key={section.id}
            section={section}
            isActive={activeSectionId === section.id}
            onSelect={() => onSelectSection(section.id)}
            onRename={(name) => updateSection.mutate({ id: section.id, name })}
            onDelete={() => deleteSection.mutate(section.id)}
            activeNoteId={activeNoteId}
            onSelectNote={onSelectNote}
          />
        ))}
      </div>

      {/* Add section */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        {isAddingSection ? (
          <div className="space-y-2">
            <Input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Section name..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSection();
                if (e.key === "Escape") setIsAddingSection(false);
              }}
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreateSection}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsAddingSection(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/[0.04]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add Section
          </button>
        )}
      </div>
    </div>
  );
}

function SectionWithNotes({
  section,
  isActive,
  onSelect,
  onRename,
  onDelete,
  activeNoteId,
  onSelectNote,
}: {
  section: Section;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
}) {
  const { data: notes } = useNotes(section.id);
  const rootNotes = (notes || []).filter((n) => !n.parent_id);

  return (
    <div>
      <SectionItem
        section={section}
        isActive={isActive}
        noteCount={rootNotes.length}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
      />

      {isActive && rootNotes.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {rootNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-all duration-300",
                activeNoteId === note.id
                  ? "bg-white/[0.06] text-white/90"
                  : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{note.title || "Untitled"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
