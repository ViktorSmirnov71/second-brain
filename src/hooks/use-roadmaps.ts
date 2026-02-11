import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Roadmap, RoadmapTask } from "@/types";

interface RoadmapWithTasks extends Roadmap {
  roadmap_tasks: RoadmapTask[];
}

export function useRoadmaps() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["roadmaps", user?.id],
    queryFn: async (): Promise<Roadmap[]> => {
      const { data, error } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useRoadmap(id: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["roadmap", id],
    queryFn: async (): Promise<RoadmapWithTasks> => {
      const { data, error } = await supabase
        .from("roadmaps")
        .select("*, roadmap_tasks(*)")
        .eq("id", id!)
        .single();

      if (error) throw error;

      return {
        ...data,
        roadmap_tasks: (data.roadmap_tasks ?? []).sort(
          (a: RoadmapTask, b: RoadmapTask) => a.sort_order - b.sort_order
        ),
      };
    },
    enabled: !!user && !!id,
  });
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("roadmaps")
        .insert({
          user_id: user!.id,
          title: input.title,
          description: input.description ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Roadmap;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useUpdateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string | null;
      linked_project_id?: string | null;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("roadmaps")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Roadmap;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap", variables.id] });
    },
  });
}

export function useDeleteRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roadmaps")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useCreateRoadmapTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      roadmap_id: string;
      title: string;
      start_date: string;
      end_date: string;
      duration: number;
      sort_order: number;
      is_milestone?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .insert({
          roadmap_id: input.roadmap_id,
          title: input.title,
          start_date: input.start_date,
          end_date: input.end_date,
          duration: input.duration,
          sort_order: input.sort_order,
          is_milestone: input.is_milestone ?? false,
          is_completed: false,
          dependencies: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as RoadmapTask;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["roadmap", variables.roadmap_id],
      });
    },
  });
}

export function useUpdateRoadmapTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      roadmap_id: string;
      title?: string;
      start_date?: string;
      end_date?: string;
      duration?: number;
      is_milestone?: boolean;
      is_completed?: boolean;
      dependencies?: string[];
      assignee_id?: string | null;
      sort_order?: number;
    }) => {
      const { id, roadmap_id: _roadmap_id, ...updates } = input;
      const { data, error } = await supabase
        .from("roadmap_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as RoadmapTask;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["roadmap", variables.roadmap_id],
      });
    },
  });
}

export function useDeleteRoadmapTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; roadmap_id: string }) => {
      const { error } = await supabase
        .from("roadmap_tasks")
        .delete()
        .eq("id", input.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["roadmap", variables.roadmap_id],
      });
    },
  });
}
