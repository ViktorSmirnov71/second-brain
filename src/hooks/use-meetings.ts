import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Meeting } from "@/types";

interface CreateMeetingInput {
  title: string;
  meeting_date: string | null;
  raw_notes: string | null;
}

interface UpdateMeetingInput {
  id: string;
  title?: string;
  raw_notes?: string | null;
  organized_notes?: string | null;
  meeting_date?: string | null;
  linked_project_id?: string | null;
}

export function useMeetings(search?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meetings", user?.id, search],
    queryFn: async (): Promise<Meeting[]> => {
      let query = supabase
        .from("meetings")
        .select("*")
        .order("meeting_date", { ascending: false, nullsFirst: false });

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Meeting[];
    },
    enabled: !!user,
  });
}

export function useMeeting(id: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meeting", id],
    queryFn: async (): Promise<Meeting> => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMeetingInput): Promise<Meeting> => {
      const { data, error } = await supabase
        .from("meetings")
        .insert({
          title: input.title,
          meeting_date: input.meeting_date,
          raw_notes: input.raw_notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMeetingInput): Promise<Meeting> => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("meetings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", data.id] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
