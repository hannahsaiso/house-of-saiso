import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectResource {
  id: string;
  project_id: string;
  resource_type: string;
  title: string;
  url: string;
  description: string | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectResources(projectId: string) {
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ["project-resources", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_resources")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProjectResource[];
    },
    enabled: !!projectId,
  });

  const addResource = useMutation({
    mutationFn: async (resource: {
      resource_type: string;
      title: string;
      url: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("project_resources")
        .insert({
          project_id: projectId,
          ...resource,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
      toast.success("Resource added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add resource");
      console.error(error);
    },
  });

  const removeResource = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from("project_resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-resources", projectId] });
      toast.success("Resource removed");
    },
    onError: (error) => {
      toast.error("Failed to remove resource");
      console.error(error);
    },
  });

  const canvaEmbeds = resources?.filter((r) => r.resource_type === "canva_embed") || [];
  const driveLinks = resources?.filter((r) => r.resource_type === "google_drive") || [];

  return {
    resources: resources || [],
    canvaEmbeds,
    driveLinks,
    isLoading,
    addResource,
    removeResource,
  };
}
