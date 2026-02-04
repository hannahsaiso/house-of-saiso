import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PerformanceLog {
  id: string;
  staff_id: string;
  log_date: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export function usePerformanceLogs(staffId?: string) {
  const queryClient = useQueryClient();

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["performance-logs", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from("performance_logs")
        .select("*")
        .eq("staff_id", staffId)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data as PerformanceLog[];
    },
    enabled: !!staffId,
  });

  const addLog = useMutation({
    mutationFn: async ({ staffId, note }: { staffId: string; note: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("performance_logs")
        .insert({
          staff_id: staffId,
          note,
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-logs"] });
      toast.success("Note added");
    },
    onError: (error) => {
      toast.error("Failed to add note: " + error.message);
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-logs"] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete note: " + error.message);
    },
  });

  return {
    logs: logs || [],
    isLoading,
    error,
    addLog,
    deleteLog,
  };
}
