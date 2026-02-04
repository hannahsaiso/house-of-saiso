import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
  client?: {
    name: string;
    company: string | null;
  } | null;
}

export function useProjects(includeArchived = false) {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", includeArchived],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select(`
          *,
          client:clients(name, company)
        `)
        .order("updated_at", { ascending: false });

      if (!includeArchived) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
  });

  const archiveProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("projects")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
          status: "archived",
        })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project archived successfully");
    },
    onError: (error) => {
      toast.error("Failed to archive project");
      console.error(error);
    },
  });

  const restoreProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({
          archived_at: null,
          archived_by: null,
          status: "active",
        })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project restored successfully");
    },
    onError: (error) => {
      toast.error("Failed to restore project");
      console.error(error);
    },
  });

  return {
    projects: projects || [],
    activeProjects: projects?.filter((p) => !p.archived_at) || [],
    archivedProjects: projects?.filter((p) => p.archived_at) || [],
    isLoading,
    archiveProject,
    restoreProject,
  };
}
