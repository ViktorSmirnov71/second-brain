import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Section, Note } from "@/types";

const DEFAULT_SECTIONS: Omit<Section, "id" | "user_id" | "created_at" | "updated_at">[] = [
  {
    name: "Active Projects",
    description: "Your active projects and pages",
    view_type: "hierarchy",
    sort_order: 0,
    is_default: true,
    kanban_columns: null,
  },
  {
    name: "Ideas",
    description: "Capture and explore ideas",
    view_type: "kanban",
    sort_order: 1,
    is_default: true,
    kanban_columns: ["New", "Exploring", "On Hold", "Done"],
  },
  {
    name: "Things to Try",
    description: "Things you want to try",
    view_type: "list",
    sort_order: 2,
    is_default: true,
    kanban_columns: null,
  },
  {
    name: "Philosophies",
    description: "Your philosophies and principles",
    view_type: "list",
    sort_order: 3,
    is_default: true,
    kanban_columns: null,
  },
];

async function ensureDefaultSections(userId: string): Promise<Section[]> {
  const { data: existing, error } = await supabase
    .from("sections")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order");

  if (error) throw error;

  if (existing && existing.length > 0) {
    return existing as Section[];
  }

  const toInsert = DEFAULT_SECTIONS.map((s) => ({ ...s, user_id: userId }));
  const { data: created, error: createError } = await supabase
    .from("sections")
    .insert(toInsert)
    .select("*")
    .order("sort_order");

  if (createError) throw createError;
  return (created ?? []) as Section[];
}

export function useSections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sections", user?.id],
    queryFn: () => ensureDefaultSections(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCreateSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; view_type: Section["view_type"] }) => {
      const { data: sections } = await supabase
        .from("sections")
        .select("sort_order")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = sections && sections.length > 0 ? sections[0].sort_order + 1 : 0;

      const { data: created, error } = await supabase
        .from("sections")
        .insert({
          user_id: user!.id,
          name: data.name,
          view_type: data.view_type,
          sort_order: nextOrder,
          is_default: false,
        })
        .select("*")
        .single();

      if (error) throw error;
      return created as Section;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", user?.id] });
    },
  });
}

export function useUpdateSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Section, "name" | "view_type" | "kanban_columns">>) => {
      const { data, error } = await supabase
        .from("sections")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Section;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", user?.id] });
    },
  });
}

export function useDeleteSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections", user?.id] });
    },
  });
}

export function useNotes(sectionId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("section_id", sectionId!)
        .order("sort_order");

      if (error) throw error;
      return (data ?? []) as Note[];
    },
    enabled: !!user && !!sectionId,
    staleTime: 10_000,
  });
}

export function useNote(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data as Note;
    },
    enabled: !!user && !!id,
    staleTime: 10_000,
  });
}

export function useNoteChildren(parentId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["note-children", parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("parent_id", parentId!)
        .order("sort_order");

      if (error) throw error;
      return (data ?? []) as Note[];
    },
    enabled: !!user && !!parentId,
    staleTime: 10_000,
  });
}

export function useCreateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      section_id: string;
      parent_id?: string | null;
      title: string;
      content?: string | null;
      type?: Note["type"];
      status?: string | null;
      metadata?: Note["metadata"];
    }) => {
      const { data: existing } = await supabase
        .from("notes")
        .select("sort_order")
        .eq("user_id", user!.id)
        .eq("section_id", data.section_id)
        .is("parent_id", data.parent_id ?? null)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { data: created, error } = await supabase
        .from("notes")
        .insert({
          user_id: user!.id,
          section_id: data.section_id,
          parent_id: data.parent_id ?? null,
          title: data.title,
          content: data.content ?? null,
          type: data.type ?? "page",
          status: data.status ?? null,
          metadata: data.metadata ?? {},
          sort_order: nextOrder,
        })
        .select("*")
        .single();

      if (error) throw error;
      return created as Note;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["notes", created.section_id] });
      if (created.parent_id) {
        queryClient.invalidateQueries({ queryKey: ["note-children", created.parent_id] });
      }
    },
  });
}

export function useUpdateNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Note, "title" | "content" | "type" | "status" | "metadata" | "sort_order" | "parent_id" | "section_id">>) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["note", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["notes", updated.section_id] });
      if (updated.parent_id) {
        queryClient.invalidateQueries({ queryKey: ["note-children", updated.parent_id] });
      }
    },
  });
}

export function useDeleteNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Pick<Note, "id" | "section_id" | "parent_id">) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id)
        .eq("user_id", user!.id);

      if (error) throw error;
      return note;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes", note.section_id] });
      queryClient.invalidateQueries({ queryKey: ["note", note.id] });
      if (note.parent_id) {
        queryClient.invalidateQueries({ queryKey: ["note-children", note.parent_id] });
      }
    },
  });
}

export function useMoveNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      section_id: string;
      parent_id: string | null;
      sort_order: number;
      status?: string | null;
    }) => {
      const { data: updated, error } = await supabase
        .from("notes")
        .update({
          section_id: data.section_id,
          parent_id: data.parent_id,
          sort_order: data.sort_order,
          status: data.status ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("user_id", user!.id)
        .select("*")
        .single();

      if (error) throw error;
      return updated as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note-children"] });
    },
  });
}
