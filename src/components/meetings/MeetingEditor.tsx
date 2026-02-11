import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUpdateMeeting, useDeleteMeeting } from "@/hooks/use-meetings";
import { toast } from "sonner";
import type { Meeting } from "@/types";

interface MeetingEditorProps {
  meeting: Meeting;
  onBack: () => void;
}

export function MeetingEditor({ meeting, onBack }: MeetingEditorProps) {
  const [title, setTitle] = useState(meeting.title);
  const [notes, setNotes] = useState(meeting.raw_notes ?? "");
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const capturedRef = useRef({ title: meeting.title, notes: meeting.raw_notes ?? "" });

  const save = useCallback(
    (data: { title?: string; raw_notes?: string | null }) => {
      updateMeeting.mutate(
        { id: meeting.id, ...data },
        {
          onError: () => {
            toast.error("Failed to save meeting");
          },
        }
      );
    },
    [meeting.id, updateMeeting]
  );

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const updates: { title?: string; raw_notes?: string | null } = {};
      if (capturedRef.current.title !== title) {
        updates.title = title;
        capturedRef.current.title = title;
      }
      if (capturedRef.current.notes !== notes) {
        updates.raw_notes = notes || null;
        capturedRef.current.notes = notes;
      }
      if (Object.keys(updates).length > 0) {
        save(updates);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, notes, save]);

  useEffect(() => {
    setTitle(meeting.title);
    setNotes(meeting.raw_notes ?? "");
    capturedRef.current = { title: meeting.title, notes: meeting.raw_notes ?? "" };
  }, [meeting.id, meeting.title, meeting.raw_notes]);

  const handleDelete = () => {
    deleteMeeting.mutate(meeting.id, {
      onSuccess: () => {
        toast.success("Meeting deleted");
        onBack();
      },
      onError: () => {
        toast.error("Failed to delete meeting");
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back to meetings list"
          >
            <ArrowLeft className="h-5 w-5 text-white/50" strokeWidth={1.5} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            Organize with AI
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          aria-label="Delete meeting"
          className="text-white/40 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title..."
          className="w-full bg-transparent text-xl font-semibold text-white/90 placeholder:text-white/30 focus:outline-none"
        />

        {meeting.meeting_date && (
          <p className="text-sm text-white/40">
            {format(new Date(meeting.meeting_date), "EEEE, MMMM d, yyyy")}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-white/40" strokeWidth={1.5} />
            <span className="text-sm text-white/40">Attendees</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {meeting.attendees &&
              meeting.attendees.map((attendee) => (
                <Badge key={attendee} variant="secondary">
                  {attendee}
                </Badge>
              ))}
            <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple border border-dashed border-white/[0.06]">
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
        </div>

        <Separator />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start typing meeting notes..."
          className="w-full min-h-[300px] bg-transparent text-sm text-white/70 placeholder:text-white/30 focus:outline-none resize-none leading-relaxed text-[16px] md:text-sm"
        />
      </div>
    </div>
  );
}
