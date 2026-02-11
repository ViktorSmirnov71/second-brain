import { useState, useCallback, useMemo } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { ViewToggle } from "@/components/notes/ViewToggle";
import { HierarchyView } from "@/components/notes/HierarchyView";
import { KanbanView } from "@/components/notes/KanbanView";
import { ListView } from "@/components/notes/ListView";
import { GalleryView } from "@/components/notes/GalleryView";
import { AddWithAIModal } from "@/components/notes/AddWithAIModal";
import {
  useSections,
  useNotes,
  useCreateNote,
  useUpdateSection,
  useMoveNote,
} from "@/hooks/use-notes";
import type { Section } from "@/types";

export function Notes() {
  const { data: sections } = useSections();
  const updateSection = useUpdateSection();
  const createNote = useCreateNote();
  const moveNote = useMoveNote();

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Auto-select first section
  const effectiveSectionId = activeSectionId || sections?.[0]?.id || null;
  const activeSection = useMemo(
    () => sections?.find((s) => s.id === effectiveSectionId) || null,
    [sections, effectiveSectionId]
  );

  const { data: notes } = useNotes(effectiveSectionId);
  const rootNotes = useMemo(
    () => (notes || []).filter((n) => !n.parent_id),
    [notes]
  );

  const handleSelectSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    setActiveNoteId(null);
    setMobileMenuOpen(false);
  }, []);

  const handleSelectNote = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    setMobileMenuOpen(false);
  }, []);

  const handleCreateNote = useCallback(
    (status?: string) => {
      if (!effectiveSectionId) return;
      createNote.mutate(
        {
          section_id: effectiveSectionId,
          title: "Untitled",
          type: "page",
          status: status ?? null,
        },
        {
          onSuccess: (created) => {
            setActiveNoteId(created.id);
          },
        }
      );
    },
    [effectiveSectionId, createNote]
  );

  const handleViewTypeChange = useCallback(
    (viewType: Section["view_type"]) => {
      if (!activeSection) return;
      updateSection.mutate({ id: activeSection.id, view_type: viewType });
    },
    [activeSection, updateSection]
  );

  const handleMoveNote = useCallback(
    (noteId: string, status: string, sortOrder: number) => {
      if (!effectiveSectionId) return;
      moveNote.mutate({
        id: noteId,
        section_id: effectiveSectionId,
        parent_id: null,
        sort_order: sortOrder,
        status,
      });
    },
    [effectiveSectionId, moveNote]
  );

  const handleAISave = useCallback(
    (generated: { title: string; content: string; type: string; section: string }) => {
      const targetSection = sections?.find(
        (s) => s.name.toLowerCase() === generated.section.toLowerCase()
      );
      const sectionId = targetSection?.id || effectiveSectionId;
      if (!sectionId) return;

      createNote.mutate(
        {
          section_id: sectionId,
          title: generated.title,
          content: generated.content,
          type: generated.type as "page" | "project" | "idea" | "philosophy" | "thing" | "group",
        },
        {
          onSuccess: (created) => {
            if (targetSection) setActiveSectionId(targetSection.id);
            setActiveNoteId(created.id);
          },
        }
      );
    },
    [sections, effectiveSectionId, createNote]
  );

  const renderView = () => {
    if (!activeSection) return null;

    switch (activeSection.view_type) {
      case "hierarchy":
        return (
          <HierarchyView
            notes={rootNotes}
            onSelectNote={handleSelectNote}
            onCreateNote={() => handleCreateNote()}
          />
        );
      case "kanban":
        return (
          <KanbanView
            notes={rootNotes}
            columns={activeSection.kanban_columns || undefined}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            onMoveNote={handleMoveNote}
          />
        );
      case "list":
        return (
          <ListView
            notes={rootNotes}
            onSelectNote={handleSelectNote}
            onCreateNote={() => handleCreateNote()}
          />
        );
      case "gallery":
        return (
          <GalleryView
            notes={rootNotes}
            onSelectNote={handleSelectNote}
            onCreateNote={() => handleCreateNote()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0">
        <NotesSidebar
          activeSectionId={effectiveSectionId}
          onSelectSection={handleSelectSection}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
        />
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Notes navigation</SheetTitle>
          <NotesSidebar
            activeSectionId={effectiveSectionId}
            onSelectSection={handleSelectSection}
            activeNoteId={activeNoteId}
            onSelectNote={handleSelectNote}
          />
        </SheetContent>
      </Sheet>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        {activeNoteId && effectiveSectionId ? (
          <NoteEditor
            noteId={activeNoteId}
            sectionId={effectiveSectionId}
            onBack={() => setActiveNoteId(null)}
            onSelectNote={handleSelectNote}
          />
        ) : (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                </Button>
                <h1 className="text-lg font-light text-white/90 tracking-tight">
                  {activeSection?.name || "Notes"}
                </h1>
              </div>
              {activeSection && (
                <ViewToggle
                  viewType={activeSection.view_type}
                  onChange={handleViewTypeChange}
                />
              )}
            </div>

            {/* View content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {renderView()}
            </div>
          </>
        )}
      </div>

      {/* FAB - Add with AI */}
      <button
        onClick={() => setAiModalOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 z-40"
        title="Add with AI"
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <AddWithAIModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onSave={handleAISave}
      />
    </div>
  );
}
