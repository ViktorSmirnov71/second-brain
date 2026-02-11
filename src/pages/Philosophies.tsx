import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Section, Note } from "@/types";

export function Philosophies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      // Find philosophies section
      const { data: sections } = await supabase
        .from("sections")
        .select("*")
        .eq("user_id", user!.id)
        .ilike("name", "%Philosophies%")
        .limit(1);

      const philosophySection = sections?.[0] ?? null;
      setSection(philosophySection);

      if (philosophySection) {
        const { data: notesData } = await supabase
          .from("notes")
          .select("*")
          .eq("section_id", philosophySection.id)
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false });

        setNotes((notesData as Note[]) ?? []);
      }

      setLoading(false);
    }

    load();
  }, [user]);

  const handleCreateSection = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("sections")
      .insert({
        user_id: user.id,
        name: "Philosophies",
        description: "Core beliefs, mental models, and guiding principles",
        view_type: "list",
        sort_order: 99,
        is_default: false,
      })
      .select()
      .single();

    if (!error && data) {
      setSection(data as Section);
    }
  };

  const handleAddNote = async () => {
    if (!user || !section) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        section_id: section.id,
        title: "Untitled Philosophy",
        content: "",
        type: "philosophy",
        sort_order: notes.length,
        metadata: {},
      })
      .select()
      .single();

    if (!error && data) {
      setNotes([data as Note, ...notes]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
      </div>
    );
  }

  // First-time state: no Philosophies section exists
  if (!section) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 max-w-md text-center">
          <BookOpen className="h-16 w-16 text-white/20 animate-float" strokeWidth={1.5} />
          <div className="space-y-2">
            <h2 className="text-2xl font-light text-white/90">Your Philosophies</h2>
            <p className="text-sm text-white/40 leading-relaxed">
              Document your core beliefs, mental models, and guiding principles.
              Build a personal framework for decision-making.
            </p>
          </div>
          <Button onClick={handleCreateSection}>
            Create Philosophies Section
          </Button>
        </div>
      </div>
    );
  }

  // Empty state: section exists but no notes
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 max-w-md text-center">
          <BookOpen className="h-12 w-12 text-white/20" strokeWidth={1.5} />
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-white/90">No philosophies yet</h2>
            <p className="text-sm text-white/40">
              Start documenting your thinking. Capture the principles and mental models that guide your decisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleAddNote}>
              <Plus className="h-4 w-4 mr-2" />
              Add manually
            </Button>
            <Button onClick={() => navigate("/chat")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Add with AI
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // With philosophies
  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title text-white/90">Philosophies</h1>
            <p className="text-sm text-white/40 mt-1">
              {notes.length} {notes.length === 1 ? "philosophy" : "philosophies"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAddNote}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
            <Button size="sm" onClick={() => navigate("/chat")}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              AI
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => navigate("/notes")}
              className="w-full text-left glass-panel rounded-lg p-5 hover:glass-active transition-all duration-300 ease-apple cursor-pointer space-y-2"
            >
              <h3 className="text-sm font-medium text-white/90">
                {note.metadata?.icon ? `${note.metadata.icon} ` : ""}
                {note.title}
              </h3>
              {note.content && (
                <p className="text-sm text-white/50 line-clamp-3">
                  {note.content.replace(/<[^>]*>/g, "").slice(0, 200)}
                </p>
              )}
              <p className="text-xs text-white/30">
                Updated{" "}
                {new Date(note.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
