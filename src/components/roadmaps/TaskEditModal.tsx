import { useState, useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { RoadmapTask } from "@/types";

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: RoadmapTask | null;
  allTasks: RoadmapTask[];
  onUpdate: (updates: Partial<RoadmapTask> & { id: string }) => void;
  onDelete: (id: string) => void;
}

export function TaskEditModal({
  open,
  onOpenChange,
  task,
  allTasks,
  onUpdate,
  onDelete,
}: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDeps, setSelectedDeps] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStartDate(task.start_date);
      setEndDate(task.end_date);
      setIsMilestone(task.is_milestone);
      setIsCompleted(task.is_completed);
      setSelectedDeps(task.dependencies ?? []);
    }
  }, [task]);

  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, differenceInDays(new Date(endDate), new Date(startDate)) + 1);
  }, [startDate, endDate]);

  const otherTasks = useMemo(
    () => allTasks.filter((t) => t.id !== task?.id),
    [allTasks, task]
  );

  const handleSave = () => {
    if (!task || !title.trim()) return;
    onUpdate({
      id: task.id,
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      duration,
      is_milestone: isMilestone,
      is_completed: isCompleted,
      dependencies: selectedDeps,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onOpenChange(false);
  };

  const toggleDep = (depId: string) => {
    setSelectedDeps((prev) =>
      prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId]
    );
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">Start Date</Label>
              <Input
                id="task-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-end">End Date</Label>
              <Input
                id="task-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between glass-surface rounded-lg px-3 py-2">
            <span className="text-sm text-white/70">Duration</span>
            <span className="text-sm font-medium text-white/90">
              {duration} {duration === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-milestone">Milestone</Label>
            <Switch
              id="task-milestone"
              checked={isMilestone}
              onCheckedChange={setIsMilestone}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-completed">Completed</Label>
            <Switch
              id="task-completed"
              checked={isCompleted}
              onCheckedChange={setIsCompleted}
            />
          </div>

          {otherTasks.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencies</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {otherTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDep(t.id)}
                    className={`w-full text-left text-sm rounded-md px-3 py-1.5 transition-all duration-300 ${
                      selectedDeps.includes(t.id)
                        ? "bg-primary/20 text-primary"
                        : "text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    {t.title}
                    {selectedDeps.includes(t.id) && (
                      <span className="ml-2 text-xs text-primary/70">
                        {format(new Date(t.end_date), "MMM d")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex !justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{task.title}&quot; from the
                  roadmap.
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

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
