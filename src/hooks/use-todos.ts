import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Todo } from "@/types";

export function useTodos(listType?: Todo["list_type"]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["todos", user?.id, listType],
    queryFn: async () => {
      let query = supabase
        .from("todos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (listType) {
        query = query.eq("list_type", listType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!user,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      todo: Partial<Pick<Todo, "title" | "date" | "list_type" | "linked_project_id" | "linked_person_id" | "notes" | "tags">>
    ) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("todos")
        .insert({
          user_id: user.id,
          title: todo.title ?? "",
          status: "active" as const,
          list_type: todo.list_type ?? "current",
          date: todo.date ?? null,
          linked_project_id: todo.linked_project_id ?? null,
          linked_person_id: todo.linked_person_id ?? null,
          notes: todo.notes ?? null,
          tags: todo.tags ?? [],
          sort_order: Date.now(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        user_id: user?.id ?? "",
        title: newTodo.title ?? "",
        status: "active",
        date: newTodo.date ?? null,
        list_type: newTodo.list_type ?? "current",
        linked_project_id: newTodo.linked_project_id ?? null,
        linked_person_id: newTodo.linked_person_id ?? null,
        notes: newTodo.notes ?? null,
        tags: newTodo.tags ?? [],
        sort_order: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      queryClient.setQueryData<Todo[]>(
        ["todos", user?.id, undefined],
        (old) => [...(old ?? []), optimisticTodo]
      );

      return { optimisticTodo };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Todo> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };

      // Auto-set completed_at when status changes to complete
      if (updates.status === "complete") {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status === "active") {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from("todos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const queryCache = queryClient.getQueriesData<Todo[]>({
        queryKey: ["todos"],
      });

      for (const [queryKey, data] of queryCache) {
        if (!data) continue;
        queryClient.setQueryData<Todo[]>(queryKey, (old) =>
          (old ?? []).map((todo) => {
            if (todo.id !== id) return todo;
            const merged = { ...todo, ...updates };
            if (updates.status === "complete") {
              merged.completed_at = new Date().toISOString();
            } else if (updates.status === "active") {
              merged.completed_at = null;
            }
            return merged;
          })
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const queryCache = queryClient.getQueriesData<Todo[]>({
        queryKey: ["todos"],
      });

      for (const [queryKey, data] of queryCache) {
        if (!data) continue;
        queryClient.setQueryData<Todo[]>(queryKey, (old) =>
          (old ?? []).filter((todo) => todo.id !== id)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      reorders: { id: string; sort_order: number }[]
    ) => {
      const promises = reorders.map(({ id, sort_order }) =>
        supabase.from("todos").update({ sort_order }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onMutate: async (reorders) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const orderMap = new Map(reorders.map((r) => [r.id, r.sort_order]));

      const queryCache = queryClient.getQueriesData<Todo[]>({
        queryKey: ["todos"],
      });

      for (const [queryKey, data] of queryCache) {
        if (!data) continue;
        queryClient.setQueryData<Todo[]>(queryKey, (old) =>
          (old ?? []).map((todo) => {
            const newOrder = orderMap.get(todo.id);
            return newOrder !== undefined
              ? { ...todo, sort_order: newOrder }
              : todo;
          })
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
