import { useState, useCallback } from "react";
import { Map, Menu, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RoadmapSidebar } from "@/components/roadmaps/RoadmapSidebar";
import { TimelineView } from "@/components/roadmaps/TimelineView";
import { GanttView } from "@/components/roadmaps/GanttView";
import { RoadmapSettings } from "@/components/roadmaps/RoadmapSettings";
import { CreateRoadmapModal } from "@/components/roadmaps/CreateRoadmapModal";
import { TaskEditModal } from "@/components/roadmaps/TaskEditModal";
import {
  useRoadmaps,
  useRoadmap,
  useCreateRoadmap,
  useUpdateRoadmap,
  useDeleteRoadmap,
  useCreateRoadmapTask,
  useUpdateRoadmapTask,
  useDeleteRoadmapTask,
} from "@/hooks/use-roadmaps";
import type { RoadmapTask } from "@/types";

export function Roadmaps() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RoadmapTask | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps();
  const { data: activeRoadmap, isLoading: roadmapLoading } = useRoadmap(selectedId);

  const createRoadmap = useCreateRoadmap();
  const updateRoadmap = useUpdateRoadmap();
  const deleteRoadmap = useDeleteRoadmap();
  const createTask = useCreateRoadmapTask();
  const updateTask = useUpdateRoadmapTask();
  const deleteTask = useDeleteRoadmapTask();

  const handleCreateRoadmap = useCallback(
    async (data: { title: string; description: string }) => {
      try {
        const roadmap = await createRoadmap.mutateAsync(data);
        setSelectedId(roadmap.id);
        setCreateOpen(false);
        toast.success("Roadmap created");
      } catch {
        toast.error("Failed to create roadmap");
      }
    },
    [createRoadmap]
  );

  const handleDeleteRoadmap = useCallback(async () => {
    if (!selectedId) return;
    try {
      await deleteRoadmap.mutateAsync(selectedId);
      setSelectedId(null);
      toast.success("Roadmap deleted");
    } catch {
      toast.error("Failed to delete roadmap");
    }
  }, [selectedId, deleteRoadmap]);

  const handleUpdateRoadmap = useCallback(
    async (updates: { title?: string; description?: string | null }) => {
      if (!selectedId) return;
      try {
        await updateRoadmap.mutateAsync({ id: selectedId, ...updates });
        toast.success("Roadmap updated");
      } catch {
        toast.error("Failed to update roadmap");
      }
    },
    [selectedId, updateRoadmap]
  );

  const handleAddTask = useCallback(async () => {
    if (!selectedId) return;
    const tasks = activeRoadmap?.roadmap_tasks ?? [];
    const lastTask = tasks[tasks.length - 1];
    const startDate = lastTask
      ? format(addDays(new Date(lastTask.end_date), 1), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    const endDate = format(addDays(new Date(startDate), 6), "yyyy-MM-dd");

    try {
      await createTask.mutateAsync({
        roadmap_id: selectedId,
        title: "New Task",
        start_date: startDate,
        end_date: endDate,
        duration: 7,
        sort_order: tasks.length,
      });
    } catch {
      toast.error("Failed to add task");
    }
  }, [selectedId, activeRoadmap, createTask]);

  const handleToggleComplete = useCallback(
    async (task: RoadmapTask) => {
      if (!selectedId) return;
      try {
        await updateTask.mutateAsync({
          id: task.id,
          roadmap_id: selectedId,
          is_completed: !task.is_completed,
        });
      } catch {
        toast.error("Failed to update task");
      }
    },
    [selectedId, updateTask]
  );

  const handleEditTask = useCallback((task: RoadmapTask) => {
    setEditingTask(task);
    setEditModalOpen(true);
  }, []);

  const handleUpdateTask = useCallback(
    async (updates: Partial<RoadmapTask> & { id: string }) => {
      if (!selectedId) return;
      try {
        await updateTask.mutateAsync({ ...updates, roadmap_id: selectedId });
      } catch {
        toast.error("Failed to update task");
      }
    },
    [selectedId, updateTask]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      if (!selectedId) return;
      try {
        await deleteTask.mutateAsync({ id, roadmap_id: selectedId });
        toast.success("Task deleted");
      } catch {
        toast.error("Failed to delete task");
      }
    },
    [selectedId, deleteTask]
  );

  const handleSelectRoadmap = useCallback(
    (id: string) => {
      setSelectedId(id);
      setSidebarOpen(false);
    },
    []
  );

  const tasks = activeRoadmap?.roadmap_tasks ?? [];

  const sidebarContent = (
    <RoadmapSidebar
      roadmaps={roadmaps}
      selectedId={selectedId}
      onSelect={handleSelectRoadmap}
      onCreateNew={() => setCreateOpen(true)}
      loading={roadmapsLoading}
    />
  );

  return (
    <div className="flex h-full min-h-0">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 glass-panel border-r border-white/[0.06]">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-white/[0.06]">
            <SheetTitle>Roadmaps</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 text-white/50" />
          </Button>
          <h1 className="text-sm font-medium text-white/90">
            {activeRoadmap?.title ?? "Roadmaps"}
          </h1>
        </div>

        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Map className="h-12 w-12 text-white/20" />
            <div className="text-center space-y-1">
              <p className="text-white/90 font-medium">
                {roadmaps.length === 0
                  ? "Create your first roadmap"
                  : "Select a roadmap"}
              </p>
              <p className="text-white/40 text-sm">
                {roadmaps.length === 0
                  ? "Plan and visualize your project timelines"
                  : "Choose a roadmap from the sidebar to get started"}
              </p>
            </div>
            {roadmaps.length === 0 && (
              <Button onClick={() => setCreateOpen(true)}>
                Create Roadmap
              </Button>
            )}
          </div>
        ) : roadmapLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
          </div>
        ) : activeRoadmap ? (
          <Tabs defaultValue="timeline" className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-lg font-semibold text-white/90">
                  {activeRoadmap.title}
                </h1>
                {activeRoadmap.description && (
                  <p className="text-sm text-white/40 mt-0.5">
                    {activeRoadmap.description}
                  </p>
                )}
              </div>
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="gantt">Gantt</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="flex-1 min-h-0">
              <TimelineView
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onAddTask={handleAddTask}
              />
            </TabsContent>

            <TabsContent value="gantt" className="flex-1 min-h-0">
              <GanttView tasks={tasks} onEditTask={handleEditTask} />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 overflow-y-auto">
              <RoadmapSettings
                roadmap={activeRoadmap}
                onUpdate={handleUpdateRoadmap}
                onDelete={handleDeleteRoadmap}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>

      <CreateRoadmapModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateRoadmap}
        loading={createRoadmap.isPending}
      />

      <TaskEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={editingTask}
        allTasks={tasks}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
