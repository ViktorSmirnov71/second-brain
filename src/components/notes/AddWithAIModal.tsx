import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface GeneratedNote {
  title: string;
  content: string;
  type: string;
  section: string;
}

interface AddWithAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: GeneratedNote) => void;
}

export function AddWithAIModal({ open, onOpenChange, onSave }: AddWithAIModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedNote | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI generation for now — in production this calls the edge function
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const type = inferType(prompt);
    setGenerated({
      title: generateTitle(prompt),
      content: `<p>${prompt}</p>`,
      type,
      section: inferSection(type),
    });

    setIsGenerating(false);
  };

  const handleSave = () => {
    if (generated) {
      onSave(generated);
      handleReset();
    }
  };

  const handleReset = () => {
    setPrompt("");
    setGenerated(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
            Add with AI
          </DialogTitle>
          <DialogDescription>
            Describe what you want to create and AI will help structure it.
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A project plan for redesigning our website..."
              className="min-h-[120px]"
              autoFocus
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              loading={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-surface rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-white/40 mb-1">Title</p>
                <p className="text-sm text-white/90 font-medium">{generated.title}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Content</p>
                <p className="text-sm text-white/70 line-clamp-3">
                  {stripHtml(generated.content)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-white/40 mb-1">Type</p>
                  <Badge variant="secondary">{generated.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Section</p>
                  <Badge variant="outline">{generated.section}</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setGenerated(null)}
                className="flex-1"
              >
                Edit
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function inferType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("philosophy") || lower.includes("principle") || lower.includes("belief")) return "philosophy";
  if (lower.includes("idea") || lower.includes("concept") || lower.includes("brainstorm")) return "idea";
  if (lower.includes("try") || lower.includes("experiment") || lower.includes("test")) return "thing";
  if (lower.includes("project") || lower.includes("plan") || lower.includes("build")) return "project";
  return "page";
}

function inferSection(type: string): string {
  const sectionMap: Record<string, string> = {
    philosophy: "Philosophies",
    idea: "Ideas",
    thing: "Things to Try",
    project: "Active Projects",
    page: "Active Projects",
  };
  return sectionMap[type] || "Active Projects";
}

function generateTitle(prompt: string): string {
  const words = prompt.split(/\s+/).slice(0, 6).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
