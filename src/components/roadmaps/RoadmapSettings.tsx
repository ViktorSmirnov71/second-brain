import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { Roadmap } from "@/types";

interface RoadmapSettingsProps {
  roadmap: Roadmap;
  onUpdate: (updates: { title?: string; description?: string | null }) => void;
  onDelete: () => void;
}

export function RoadmapSettings({
  roadmap,
  onUpdate,
  onDelete,
}: RoadmapSettingsProps) {
  const [title, setTitle] = useState(roadmap.title);
  const [description, setDescription] = useState(roadmap.description ?? "");

  useEffect(() => {
    setTitle(roadmap.title);
    setDescription(roadmap.description ?? "");
  }, [roadmap]);

  const handleSave = () => {
    onUpdate({
      title: title.trim() || roadmap.title,
      description: description.trim() || null,
    });
  };

  const hasChanges =
    title.trim() !== roadmap.title ||
    (description.trim() || null) !== (roadmap.description ?? null);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="settings-title">Title</Label>
        <Input
          id="settings-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-desc">Description</Label>
        <Textarea
          id="settings-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe this roadmap..."
        />
      </div>

      <div className="space-y-2">
        <Label>Linked Project</Label>
        <div className="glass-surface rounded-lg px-3 py-2 text-sm text-white/40">
          No project linked (coming soon)
        </div>
      </div>

      <Button onClick={handleSave} disabled={!hasChanges || !title.trim()}>
        Save Changes
      </Button>

      <div className="pt-6 border-t border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/90 mb-3">Danger Zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Roadmap
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete roadmap?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{roadmap.title}&quot; and all
                its tasks. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
