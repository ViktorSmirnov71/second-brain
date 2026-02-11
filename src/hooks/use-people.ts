import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Person, NoteOnPerson } from "@/types";

interface CreatePersonInput {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  met_at?: string | null;
  tags?: string[];
}

interface UpdatePersonInput {
  id: string;
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  met_at?: string | null;
  tags?: string[];
}

interface AddNoteOnPersonInput {
  person_id: string;
  content: string;
}

export function usePeople(search?: string, tags?: string[]) {
  const { user } = useAuth();

  return useQuery<Person[]>({
    queryKey: ["people", user?.id, search, tags],
    queryFn: async () => {
      let query = supabase
        .from("people")
        .select("*")
        .eq("user_id", user!.id)
        .order("name", { ascending: true });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      let people = (data ?? []) as Person[];

      // Client-side tag filtering since tags are stored as an array column
      if (tags && tags.length > 0) {
        people = people.filter((person) =>
          tags.some((tag) => person.tags?.includes(tag))
        );
      }

      return people;
    },
    enabled: !!user,
  });
}

export function usePerson(id: string | null) {
  const { user } = useAuth();

  const personQuery = useQuery<Person>({
    queryKey: ["person", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Person;
    },
    enabled: !!user && !!id,
  });

  const notesQuery = useQuery<NoteOnPerson[]>({
    queryKey: ["person-notes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_on_person")
        .select("*")
        .eq("person_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NoteOnPerson[];
    },
    enabled: !!user && !!id,
  });

  return {
    person: personQuery.data,
    notes: notesQuery.data ?? [],
    isLoading: personQuery.isLoading,
    isError: personQuery.isError,
  };
}

export function useCreatePerson() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePersonInput) => {
      const { data, error } = await supabase
        .from("people")
        .insert({
          user_id: user!.id,
          name: input.name,
          company: input.company ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          linkedin: input.linkedin ?? null,
          met_at: input.met_at ?? null,
          tags: input.tags ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as Person;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePersonInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("people")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Person;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["person", data.id] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("people").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useAddNoteOnPerson() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddNoteOnPersonInput) => {
      const { data, error } = await supabase
        .from("notes_on_person")
        .insert({
          person_id: input.person_id,
          user_id: user!.id,
          content: input.content,
        })
        .select()
        .single();
      if (error) throw error;
      return data as NoteOnPerson;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["person-notes", variables.person_id],
      });
    },
  });
}
