import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReviewTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  assigned_to: string | null;
  shared_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    client?: {
      name: string;
    } | null;
  } | null;
  assignee?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export function useApprovalQueue() {
  const queryClient = useQueryClient();

  const { data: reviewTasks, isLoading } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: async () => {
      // First get tasks in review status
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          project:projects(title, client:clients(name))
        `)
        .eq("status", "review")
        .order("updated_at", { ascending: false });

      if (tasksError) throw tasksError;

      // Then fetch assignee profiles separately
      const assigneeIds = tasks
        .map((t) => t.assigned_to)
        .filter((id): id is string => id !== null);

      let assigneeMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", assigneeIds);

        if (profiles) {
          assigneeMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name || "", avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string; avatar_url: string | null }>);
        }
      }

      // Combine tasks with assignees
      return tasks.map((task) => ({
        ...task,
        assignee: task.assigned_to ? assigneeMap[task.assigned_to] || null : null,
      })) as ReviewTask[];
    },
  });

  const approveTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task approved and marked as done");
    },
    onError: (error) => {
      toast.error("Failed to approve task: " + error.message);
    },
  });

  const addFeedback = useMutation({
    mutationFn: async ({ taskId, feedback }: { taskId: string; feedback: string }) => {
      // Get current notes
      const { data: task } = await supabase
        .from("tasks")
        .select("internal_notes")
        .eq("id", taskId)
        .single();

      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] Feedback: ${feedback}`;
      const updatedNotes = task?.internal_notes 
        ? `${task.internal_notes}\n\n${newNote}` 
        : newNote;

      const { error } = await supabase
        .from("tasks")
        .update({ 
          internal_notes: updatedNotes,
          status: "in_progress" // Send back to in progress for revision
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Feedback sent, task returned for revision");
    },
    onError: (error) => {
      toast.error("Failed to add feedback: " + error.message);
    },
  });

  return {
    reviewTasks: reviewTasks || [],
    isLoading,
    approveTask,
    addFeedback,
  };
}
