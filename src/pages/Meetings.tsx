import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MeetingList } from "@/components/meetings/MeetingList";
import { MeetingSearch } from "@/components/meetings/MeetingSearch";
import { MeetingEditor } from "@/components/meetings/MeetingEditor";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";
import {
  useMeetings,
  useMeeting,
  useCreateMeeting,
} from "@/hooks/use-meetings";
import { toast } from "sonner";

export function Meetings() {
  const [search, setSearch] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: meetings = [], isLoading } = useMeetings(search);
  const { data: selectedMeeting } = useMeeting(selectedMeetingId);
  const createMeeting = useCreateMeeting();

  const handleCreateMeeting = (data: {
    title: string;
    meeting_date: string | null;
    raw_notes: string | null;
  }) => {
    createMeeting.mutate(data, {
      onSuccess: (meeting) => {
        setShowNewModal(false);
        setSelectedMeetingId(meeting.id);
        toast.success("Meeting created");
      },
      onError: () => {
        toast.error("Failed to create meeting");
      },
    });
  };

  if (selectedMeetingId && selectedMeeting) {
    return (
      <div className="flex flex-col h-full p-6">
        <MeetingEditor
          meeting={selectedMeeting}
          onBack={() => setSelectedMeetingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-page-title text-white/90">Meetings</h1>
          {meetings.length > 0 && (
            <Badge variant="secondary">{meetings.length}</Badge>
          )}
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Meeting
        </Button>
      </div>

      <MeetingSearch value={search} onChange={setSearch} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
          </div>
        ) : (
          <MeetingList
            meetings={meetings}
            onSelectMeeting={setSelectedMeetingId}
            onNewMeeting={() => setShowNewModal(true)}
          />
        )}
      </div>

      <NewMeetingModal
        open={showNewModal}
        onOpenChange={setShowNewModal}
        onCreateMeeting={handleCreateMeeting}
        loading={createMeeting.isPending}
      />
    </div>
  );
}
