import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  compareDesc,
} from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "./MeetingCard";
import type { Meeting } from "@/types";

interface MeetingListProps {
  meetings: Meeting[];
  onSelectMeeting: (id: string) => void;
  onNewMeeting: () => void;
}

interface MeetingGroup {
  label: string;
  meetings: Meeting[];
}

function groupMeetings(meetings: Meeting[]): MeetingGroup[] {
  const groups: Record<string, Meeting[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Earlier: [],
  };

  for (const meeting of meetings) {
    const date = meeting.meeting_date
      ? new Date(meeting.meeting_date)
      : null;

    if (!date) {
      groups["Earlier"].push(meeting);
    } else if (isToday(date)) {
      groups["Today"].push(meeting);
    } else if (isYesterday(date)) {
      groups["Yesterday"].push(meeting);
    } else if (isThisWeek(date)) {
      groups["This Week"].push(meeting);
    } else if (isThisMonth(date)) {
      groups["This Month"].push(meeting);
    } else {
      groups["Earlier"].push(meeting);
    }
  }

  const order = ["Today", "Yesterday", "This Week", "This Month", "Earlier"];
  return order
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      meetings: groups[label].sort((a, b) => {
        const da = a.meeting_date ? new Date(a.meeting_date) : new Date(0);
        const db = b.meeting_date ? new Date(b.meeting_date) : new Date(0);
        return compareDesc(da, db);
      }),
    }));
}

export function MeetingList({
  meetings,
  onSelectMeeting,
  onNewMeeting,
}: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Calendar className="h-12 w-12 text-white/20" strokeWidth={1.5} />
        <div className="text-center space-y-1">
          <p className="text-white/90 font-medium">No meetings yet</p>
          <p className="text-white/40 text-sm">
            Create your first meeting to get started
          </p>
        </div>
        <Button onClick={onNewMeeting}>Create Meeting</Button>
      </div>
    );
  }

  const groups = groupMeetings(meetings);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onClick={() => onSelectMeeting(meeting.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
