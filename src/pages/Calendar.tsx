import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  dayOffset: number;
  location: string | null;
  attendees: string[];
  color: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 22;

const EVENT_COLORS = [
  "border-l-blue-400",
  "border-l-purple-400",
  "border-l-emerald-400",
  "border-l-amber-400",
  "border-l-rose-400",
  "border-l-cyan-400",
];

function generateMockEvents(): CalendarEvent[] {
  return [
    {
      id: "1",
      title: "Team Standup",
      description: "Daily sync with the engineering team. Review blockers and progress.",
      startHour: 9,
      startMinute: 0,
      durationMinutes: 30,
      dayOffset: 0,
      location: "Zoom",
      attendees: ["Alex Chen", "Sarah Kim"],
      color: EVENT_COLORS[0],
    },
    {
      id: "2",
      title: "Product Review",
      description: "Weekly product review meeting. Present sprint progress and demo new features.",
      startHour: 14,
      startMinute: 0,
      durationMinutes: 60,
      dayOffset: 0,
      location: "Conference Room A",
      attendees: ["Jordan Lee", "Maria Garcia", "Alex Chen"],
      color: EVENT_COLORS[1],
    },
    {
      id: "3",
      title: "Design Workshop",
      description: "Collaborative design session for the new dashboard layout.",
      startHour: 10,
      startMinute: 30,
      durationMinutes: 90,
      dayOffset: 1,
      location: null,
      attendees: ["Sarah Kim"],
      color: EVENT_COLORS[2],
    },
    {
      id: "4",
      title: "Lunch with Investors",
      description: "Q1 update lunch meeting with Series A investors.",
      startHour: 12,
      startMinute: 0,
      durationMinutes: 90,
      dayOffset: 2,
      location: "The Capital Grille",
      attendees: ["David Park", "Lisa Wong"],
      color: EVENT_COLORS[3],
    },
    {
      id: "5",
      title: "Code Review",
      description: "Review PRs for the authentication module refactor.",
      startHour: 15,
      startMinute: 30,
      durationMinutes: 60,
      dayOffset: 2,
      location: "Zoom",
      attendees: ["Alex Chen"],
      color: EVENT_COLORS[0],
    },
    {
      id: "6",
      title: "Sprint Planning",
      description: "Plan the next two-week sprint. Prioritize backlog items.",
      startHour: 10,
      startMinute: 0,
      durationMinutes: 120,
      dayOffset: 3,
      location: "Conference Room B",
      attendees: ["Jordan Lee", "Sarah Kim", "Alex Chen", "Maria Garcia"],
      color: EVENT_COLORS[4],
    },
    {
      id: "7",
      title: "1:1 with Manager",
      description: "Weekly one-on-one catch-up.",
      startHour: 16,
      startMinute: 0,
      durationMinutes: 30,
      dayOffset: 4,
      location: null,
      attendees: ["Jordan Lee"],
      color: EVENT_COLORS[5],
    },
    {
      id: "8",
      title: "Morning Yoga",
      description: "Team wellness session.",
      startHour: 8,
      startMinute: 0,
      durationMinutes: 45,
      dayOffset: 4,
      location: "Rooftop Terrace",
      attendees: [],
      color: EVENT_COLORS[2],
    },
  ];
}

function WeekView({
  weekStart,
  events,
  onEventClick,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <div className="flex-1 min-h-0 overflow-auto scrollbar-none">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 glass-panel border-b border-white/[0.06]">
          <div className="p-2" />
          {DAY_NAMES.map((name, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const isToday = date.getTime() === today.getTime();
            return (
              <div key={name} className="p-3 text-center border-l border-white/[0.06]">
                <p className="text-xs text-white/40 uppercase tracking-wider">{name}</p>
                <p
                  className={`text-lg font-light mt-0.5 ${
                    isToday
                      ? "text-primary font-medium"
                      : "text-white/70"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-3 pt-0"
              >
                <span className="text-xs text-white/30 -translate-y-2">
                  {formatTime(hour, 0)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAY_NAMES.map((_, dayIndex) => (
            <div key={dayIndex} className="relative border-l border-white/[0.06]">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-white/[0.04]"
                />
              ))}

              {/* Events for this day */}
              {events
                .filter((e) => e.dayOffset === dayIndex)
                .map((event) => {
                  const topOffset =
                    (event.startHour - START_HOUR) * 64 +
                    (event.startMinute / 60) * 64;
                  const height = (event.durationMinutes / 60) * 64;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute left-1 right-1 rounded-md glass-surface border-l-2 ${event.color} px-2 py-1.5 text-left hover:glass-active transition-all duration-300 ease-apple overflow-hidden cursor-pointer`}
                      style={{
                        top: `${topOffset}px`,
                        height: `${Math.max(height, 24)}px`,
                      }}
                    >
                      <p className="text-xs font-medium text-white/90 truncate">
                        {event.title}
                      </p>
                      {height >= 40 && (
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {formatTime(event.startHour, event.startMinute)}
                        </p>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgendaView({
  weekStart,
  events,
  onEventClick,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const grouped = useMemo(() => {
    const groups: { date: Date; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dayEvents = events.filter((e) => e.dayOffset === i);
      if (dayEvents.length > 0) {
        groups.push({ date, events: dayEvents });
      }
    }
    return groups;
  }, [weekStart, events]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-4 space-y-6">
      {grouped.map(({ date, events: dayEvents }) => (
        <div key={date.toISOString()}>
          <p className="text-sm font-medium text-white/70 mb-3">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="space-y-2">
            {dayEvents
              .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute))
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`w-full text-left glass-panel rounded-lg p-4 border-l-2 ${event.color} hover:glass-active transition-all duration-300 ease-apple cursor-pointer`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.startHour, event.startMinute)}
                        </span>
                        {event.location && (
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        {event.attendees.length > 0 && (
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Calendar() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile] = useState(() => window.innerWidth < 768);

  const weekStart = useMemo(() => {
    const start = getWeekStart(new Date());
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [weekStart]);

  const events = useMemo(() => generateMockEvents(), []);

  const getEventEndTime = (event: CalendarEvent) => {
    const totalMinutes =
      event.startHour * 60 + event.startMinute + event.durationMinutes;
    return formatTime(Math.floor(totalMinutes / 60), totalMinutes % 60);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Navigation header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-page-title text-white/90">Calendar</h1>
          <p className="text-sm text-white/40 mt-1">
            {formatDate(weekStart)}
            {weekStart.getMonth() !== weekEnd.getMonth() &&
              ` — ${formatDate(weekEnd)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className={weekOffset === 0 ? "text-primary" : ""}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            <ChevronRight className="h-4 w-4 text-white/50" />
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      {isMobile ? (
        <AgendaView
          weekStart={weekStart}
          events={events}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <WeekView
          weekStart={weekStart}
          events={events}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Footer banner */}
      <div className="p-4">
        <div className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-white/40">
            Showing mock events. Connect Google Calendar in Settings to see real events.
          </p>
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={() => navigate("/settings")}
          >
            Go to Settings
          </Button>
        </div>
      </div>

      {/* Event detail dialog */}
      <Dialog
        open={selectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        {selectedEvent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>{selectedEvent.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Clock className="h-4 w-4 text-white/40" />
                <span>
                  {formatTime(selectedEvent.startHour, selectedEvent.startMinute)}{" "}
                  — {getEventEndTime(selectedEvent)}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4 text-white/40" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.attendees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Users className="h-4 w-4 text-white/40" />
                    <span>Attendees</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {selectedEvent.attendees.map((attendee) => (
                      <Badge key={attendee} variant="secondary">
                        {attendee}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
