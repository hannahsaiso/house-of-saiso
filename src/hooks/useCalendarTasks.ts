import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  project_id: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  project?: {
    title: string;
  } | null;
}

export interface CreateCalendarTaskData {
  title: string;
  description?: string;
  due_date: string;
  priority?: string;
  project_id: string;
}

export interface UpdateCalendarTaskData {
  id: string;
  title?: string;
  description?: string;
  due_date?: string;
  priority?: string;
  status?: string;
}

export function useCalendarTasks() {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["calendar-tasks"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          project_id,
          assigned_to,
          created_by,
          created_at,
          project:projects(title)
        `)
        .not("due_date", "is", null)
        .neq("status", "done")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as CalendarTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: CreateCalendarTaskData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("tasks")
        .insert({
          ...data,
          priority: data.priority || "medium",
          status: "todo",
          assigned_to: user.user.id,
          created_by: user.user.id,
        })
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          project_id,
          assigned_to,
          created_by,
          created_at,
          project:projects(title)
        `)
        .single();

      if (error) throw error;
      return result as CalendarTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks-calendar"] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create task: " + error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCalendarTaskData) => {
      const { data: result, error } = await supabase
        .from("tasks")
        .update(data)
        .eq("id", id)
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          project_id,
          assigned_to,
          created_by,
          created_at,
          project:projects(title)
        `)
        .single();

      if (error) throw error;
      return result as CalendarTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks-calendar"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks-calendar"] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks-calendar"] });
      toast.success("Task completed");
    },
    onError: (error) => {
      toast.error("Failed to complete task: " + error.message);
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    markComplete,
  };
}
