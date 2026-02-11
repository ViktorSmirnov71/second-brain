import { useMemo, useState } from "react";
import { Plus, Search, Users, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeopleTable } from "@/components/people/PeopleTable";
import { PeopleGrid } from "@/components/people/PeopleGrid";
import { TagFilter } from "@/components/people/TagFilter";
import { AddPersonModal } from "@/components/people/AddPersonModal";
import { PersonDetailPanel } from "@/components/people/PersonDetailPanel";
import { usePeople } from "@/hooks/use-people";
import type { Person } from "@/types";

export function People() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [view, setView] = useState<"table" | "grid">("table");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: people = [], isLoading } = usePeople(
    search || undefined,
    selectedTags.length > 0 ? selectedTags : undefined
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    people.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [people]);

  const handleSelectPerson = (person: Person) => {
    setSelectedPersonId(person.id);
    setDetailOpen(true);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isEmpty = !isLoading && people.length === 0;
  const isSearchEmpty = isEmpty && (search || selectedTags.length > 0);
  const isNoData = isEmpty && !search && selectedTags.length === 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <h1 className="text-page-title text-white/90">People</h1>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="hidden md:inline-flex gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add Person
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" strokeWidth={1.5} />
          <Input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onClearAll={() => setSelectedTags([])}
        />
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <List className="h-4 w-4 text-white/50" strokeWidth={1.5} />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4 text-white/50" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pb-24 md:pb-6">
        {isNoData && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Users className="h-12 w-12 text-white/20" strokeWidth={1.5} />
            <div className="text-center space-y-1">
              <p className="text-white/90 font-medium">No people yet</p>
              <p className="text-white/40 text-sm">
                Add your first contact to get started
              </p>
            </div>
            <Button onClick={() => setAddModalOpen(true)}>Add Person</Button>
          </div>
        )}

        {isSearchEmpty && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Search className="h-12 w-12 text-white/20" strokeWidth={1.5} />
            <div className="text-center space-y-1">
              <p className="text-white/90 font-medium">No matches found</p>
              <p className="text-white/40 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Desktop: toggle between table/grid. Mobile: always grid */}
            <div className="hidden md:block">
              {view === "table" ? (
                <PeopleTable
                  people={people}
                  onSelectPerson={handleSelectPerson}
                />
              ) : (
                <PeopleGrid
                  people={people}
                  onSelectPerson={handleSelectPerson}
                />
              )}
            </div>
            <div className="block md:hidden">
              <PeopleGrid
                people={people}
                onSelectPerson={handleSelectPerson}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:hidden h-14 w-14 rounded-full shadow-2xl"
        size="icon"
        aria-label="Add person"
      >
        <Plus className="h-6 w-6" strokeWidth={1.5} />
      </Button>

      {/* Modals & Panels */}
      <AddPersonModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <PersonDetailPanel
        personId={selectedPersonId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
