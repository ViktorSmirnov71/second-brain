import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  differenceInDays,
  addDays,
  format,
  startOfDay,
  isSameMonth,
} from "date-fns";
import { Diamond, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoadmapTask } from "@/types";

type ZoomLevel = "day" | "halfMonth" | "month" | "quarter";

interface GanttViewProps {
  tasks: RoadmapTask[];
  onEditTask: (task: RoadmapTask) => void;
}

const ZOOM_CONFIG: Record<ZoomLevel, { columnWidth: number; label: string }> = {
  day: { columnWidth: 40, label: "Day" },
  halfMonth: { columnWidth: 24, label: "Half Mo" },
  month: { columnWidth: 12, label: "Month" },
  quarter: { columnWidth: 4, label: "Quarter" },
};

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 48;
const SIDEBAR_WIDTH = 200;

export function GanttView({ tasks, onEditTask }: GanttViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("day");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll protection: prevent page scroll when scrolling horizontally in Gantt
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        const atStart = scrollLeft <= 0 && e.deltaX < 0;
        const atEnd =
          scrollLeft + clientWidth >= scrollWidth - 1 && e.deltaX > 0;

        if (!atStart && !atEnd) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const { startDate, totalDays, dateColumns } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return {
        startDate: today,
        totalDays: 30,
        dateColumns: Array.from({ length: 30 }, (_, i) => addDays(today, i)),
      };
    }

    const allDates = tasks.flatMap((t) => [
      new Date(t.start_date),
      new Date(t.end_date),
    ]);
    const minDate = startOfDay(
      new Date(Math.min(...allDates.map((d) => d.getTime())))
    );
    const maxDate = startOfDay(
      new Date(Math.max(...allDates.map((d) => d.getTime())))
    );

    const padding = 3;
    const start = addDays(minDate, -padding);
    const days = differenceInDays(maxDate, minDate) + padding * 2 + 1;
    const cols = Array.from({ length: days }, (_, i) => addDays(start, i));

    return { startDate: start, totalDays: days, dateColumns: cols };
  }, [tasks]);

  const config = ZOOM_CONFIG[zoom];
  const totalWidth = totalDays * config.columnWidth;

  const getBarStyle = useCallback(
    (task: RoadmapTask) => {
      const taskStart = startOfDay(new Date(task.start_date));
      const taskEnd = startOfDay(new Date(task.end_date));
      const offsetDays = differenceInDays(taskStart, startDate);
      const durationDays = differenceInDays(taskEnd, taskStart) + 1;

      return {
        left: offsetDays * config.columnWidth,
        width: Math.max(durationDays * config.columnWidth, config.columnWidth),
      };
    },
    [startDate, config.columnWidth]
  );

  const zoomLevels: ZoomLevel[] = ["day", "halfMonth", "month", "quarter"];

  const cycleZoom = (direction: "in" | "out") => {
    const currentIdx = zoomLevels.indexOf(zoom);
    const nextIdx =
      direction === "in"
        ? Math.max(0, currentIdx - 1)
        : Math.min(zoomLevels.length - 1, currentIdx + 1);
    setZoom(zoomLevels[nextIdx]);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 space-y-3">
        <Diamond className="h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40 text-center">
          Gantt view is available on desktop
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Diamond className="h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">
          Add tasks to see the Gantt chart
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.06]">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => cycleZoom("in")}
          disabled={zoom === "day"}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4 text-white/50" />
        </Button>
        <div className="flex gap-1">
          {zoomLevels.map((level) => (
            <Button
              key={level}
              variant={zoom === level ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setZoom(level)}
            >
              {ZOOM_CONFIG[level].label}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => cycleZoom("out")}
          disabled={zoom === "quarter"}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4 text-white/50" />
        </Button>
      </div>

      {/* Gantt body */}
      <div className="flex-1 min-h-0 flex">
        {/* Task name sidebar */}
        <div
          className="shrink-0 border-r border-white/[0.06]"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <div
            className="border-b border-white/[0.06] flex items-center px-4 text-xs font-medium text-white/40 uppercase tracking-wider"
            style={{ height: HEADER_HEIGHT }}
          >
            Task
          </div>
          <div className="overflow-hidden">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center px-4 gap-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors"
                style={{ height: ROW_HEIGHT }}
                onClick={() => onEditTask(task)}
              >
                {task.is_milestone && (
                  <Diamond className="h-3 w-3 text-amber-400 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm truncate",
                    task.is_completed ? "text-white/40 line-through" : "text-white/70"
                  )}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline scroll area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden"
          style={{ overscrollBehaviorX: "contain" }}
        >
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Date header */}
            <div
              className="flex border-b border-white/[0.06] sticky top-0 bg-[hsl(0_0%_3%)]"
              style={{ height: HEADER_HEIGHT }}
            >
              {dateColumns.map((date, i) => {
                const showLabel =
                  zoom === "day" ||
                  (zoom === "halfMonth" && (date.getDate() === 1 || date.getDate() === 15)) ||
                  (zoom === "month" && date.getDate() === 1) ||
                  (zoom === "quarter" &&
                    date.getDate() === 1 &&
                    [0, 3, 6, 9].includes(date.getMonth()));

                const isMonthStart = date.getDate() === 1;

                return (
                  <div
                    key={i}
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center text-[10px] text-white/30",
                      isMonthStart && "border-l border-white/[0.08]"
                    )}
                    style={{ width: config.columnWidth }}
                  >
                    {showLabel && (
                      <>
                        {(zoom === "day" || (zoom === "halfMonth" && !isSameMonth(date, dateColumns[i - 1] ?? date))) && (
                          <span className="text-white/50 font-medium">
                            {format(date, "MMM")}
                          </span>
                        )}
                        {zoom === "month" && (
                          <span className="text-white/50 font-medium">
                            {format(date, "MMM")}
                          </span>
                        )}
                        {zoom === "quarter" && (
                          <span className="text-white/50 font-medium">
                            Q{Math.floor(date.getMonth() / 3) + 1}
                          </span>
                        )}
                        <span>
                          {zoom === "day"
                            ? format(date, "d")
                            : zoom === "halfMonth"
                              ? format(date, "d")
                              : ""}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Row backgrounds */}
              {tasks.map((task, i) => (
                <div
                  key={`bg-${task.id}`}
                  className={cn(
                    "border-b border-white/[0.04]",
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                  )}
                  style={{ height: ROW_HEIGHT }}
                />
              ))}

              {/* Bars overlay */}
              <div className="absolute inset-0">
                {tasks.map((task, index) => {
                  const barStyle = getBarStyle(task);
                  const top = index * ROW_HEIGHT + 8;

                  if (task.is_milestone) {
                    return (
                      <div
                        key={task.id}
                        className="absolute cursor-pointer"
                        style={{
                          left: barStyle.left + barStyle.width / 2 - 10,
                          top: top + 2,
                        }}
                        onClick={() => onEditTask(task)}
                      >
                        <Diamond className="h-5 w-5 text-amber-400 fill-amber-400/30" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "absolute rounded-md cursor-pointer transition-all duration-300 hover:brightness-110",
                        task.is_completed
                          ? "bg-emerald-500/50"
                          : "bg-primary/70"
                      )}
                      style={{
                        left: barStyle.left,
                        top,
                        width: barStyle.width,
                        height: ROW_HEIGHT - 16,
                      }}
                      onClick={() => onEditTask(task)}
                    >
                      {barStyle.width > 60 && (
                        <span className="text-[11px] text-white/90 font-medium px-2 leading-[24px] truncate block">
                          {task.title}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
