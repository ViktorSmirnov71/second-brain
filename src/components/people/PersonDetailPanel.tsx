import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  usePerson,
  useUpdatePerson,
  useDeletePerson,
  useAddNoteOnPerson,
} from "@/hooks/use-people";
import { getInitials, getAvatarColor, formatRelativeDate } from "./utils";

interface PersonDetailPanelProps {
  personId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonDetailPanel({
  personId,
  open,
  onOpenChange,
}: PersonDetailPanelProps) {
  const { person, notes, isLoading } = usePerson(personId);
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const addNote = useAddNoteOnPerson();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phone, setPhone] = useState("");
  const [metAt, setMetAt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [newNote, setNewNote] = useState("");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (person) {
      setName(person.name);
      setCompany(person.company ?? "");
      setEmail(person.email ?? "");
      setLinkedin(person.linkedin ?? "");
      setPhone(person.phone ?? "");
      setMetAt(person.met_at ?? "");
      setTagsInput(person.tags?.join(", ") ?? "");
    }
  }, [person]);

  const debouncedSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!personId) return;
        try {
          await updatePerson.mutateAsync({
            id: personId,
            ...updates,
          });
        } catch (error) {
          console.error("Failed to update person:", error);
          toast.error("Failed to save changes");
        }
      }, 500);
    },
    [personId, updatePerson]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleFieldBlur = (field: string, value: string) => {
    if (!person) return;

    if (field === "tags") {
      const tags = value
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      debouncedSave({ [field]: tags });
    } else {
      const currentValue = person[field as keyof typeof person];
      const newValue = value.trim() || null;
      if (currentValue !== newValue) {
        debouncedSave({ [field]: newValue });
      }
    }
  };

  const handleDelete = async () => {
    if (!personId) return;
    try {
      await deletePerson.mutateAsync(personId);
      toast.success("Person deleted");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete person:", error);
      toast.error("Failed to delete person");
    }
  };

  const handleAddNote = async () => {
    if (!personId || !newNote.trim()) return;
    try {
      await addNote.mutateAsync({
        person_id: personId,
        content: newNote.trim(),
      });
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note");
    }
  };

  if (isLoading || !person) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto scrollbar-none sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Loading...</SheetTitle>
            <SheetDescription>Loading person details</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto scrollbar-none sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {person.avatar_url && (
                <AvatarImage src={person.avatar_url} alt={person.name} />
              )}
              <AvatarFallback className={getAvatarColor(person.name)}>
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{person.name}</SheetTitle>
              <SheetDescription>
                {person.company ?? "No company"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="detail-name">Name</Label>
            <Input
              id="detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleFieldBlur("name", name)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-company">Company</Label>
            <Input
              id="detail-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onBlur={() => handleFieldBlur("company", company)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-email">Email</Label>
            <Input
              id="detail-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleFieldBlur("email", email)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-linkedin">LinkedIn</Label>
            <Input
              id="detail-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              onBlur={() => handleFieldBlur("linkedin", linkedin)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-phone">Phone</Label>
            <Input
              id="detail-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleFieldBlur("phone", phone)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-met-at">Met at</Label>
            <Input
              id="detail-met-at"
              type="date"
              value={metAt}
              onChange={(e) => setMetAt(e.target.value)}
              onBlur={() => handleFieldBlur("met_at", metAt)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-tags">Tags (comma-separated)</Label>
            <Input
              id="detail-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onBlur={() => handleFieldBlur("tags", tagsInput)}
              placeholder="friend, work, ..."
            />
            {person.tags && person.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {person.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="border-t glass-divider pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Notes</Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-white/40 py-2">No notes yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="glass-surface rounded-lg px-3 py-2"
                  >
                    <p className="text-sm text-white/70">{note.content}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {formatRelativeDate(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t glass-divider pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  Delete Person
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this person and all associated notes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
