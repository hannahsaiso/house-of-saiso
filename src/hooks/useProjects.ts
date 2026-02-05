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
     brand_assets_folder?: string | null;
  } | null;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  client_id?: string;
  due_date?: string;
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
           client:clients(name, company, brand_assets_folder)
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

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          ...data,
          created_by: user.id,
        })
        .select(`*, client:clients(name, company)`)
        .single();

      if (error) throw error;

      // Automatically create Google Drive folder for the project
      if (project.client) {
        try {
          await supabase.functions.invoke("create-project-drive", {
            body: {
              project_id: project.id,
              client_name: project.client.name,
              user_id: user.id,
            },
          });
          console.log("Project Drive folder created automatically");
        } catch (driveError) {
          // Don't fail project creation if Drive folder fails
          console.error("Optional Drive folder creation failed:", driveError);
        }
      }

      return project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create project: " + error.message);
    },
  });

   const updateProjectStatus = useMutation({
     mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const { data: project, error } = await supabase
         .from("projects")
         .update({ status })
         .eq("id", projectId)
         .select(`*, client:clients(name, company, brand_assets_folder)`)
         .single();
 
       if (error) throw error;
 
       // If status changed to active, ensure Drive folder exists
       if (status === "active" && project.client && !project.client.brand_assets_folder) {
         try {
           await supabase.functions.invoke("create-project-drive", {
             body: {
               project_id: project.id,
               client_name: project.client.name,
               user_id: user.id,
             },
           });
           console.log("Project Drive folder created on activation");
         } catch (driveError) {
           console.error("Drive folder creation failed:", driveError);
         }
       }
 
       return project as Project;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["projects"] });
       toast.success("Project status updated");
     },
     onError: (error) => {
       toast.error("Failed to update status: " + error.message);
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
    createProject,
     updateProjectStatus,
    archiveProject,
    restoreProject,
  };
}
