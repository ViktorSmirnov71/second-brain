import { format } from "date-fns";
import { Users } from "lucide-react";
import type { Meeting } from "@/types";

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const preview =
    meeting.organized_notes || meeting.raw_notes || "";
  const plainPreview = preview.replace(/<[^>]*>/g, "").slice(0, 120);

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-panel p-4 rounded-[14px] hover:glass-active transition-all duration-300 ease-apple space-y-2 group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-white/90 truncate flex-1">
          {meeting.title}
        </h3>
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex items-center gap-1 shrink-0 text-white/40">
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="text-xs">{meeting.attendees.length}</span>
          </div>
        )}
      </div>

      {meeting.meeting_date && (
        <p className="text-xs text-white/40">
          {format(new Date(meeting.meeting_date), "MMM d, yyyy 'at' h:mm a")}
        </p>
      )}

      {plainPreview && (
        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
          {plainPreview}
        </p>
      )}
    </button>
  );
}
