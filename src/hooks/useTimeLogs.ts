 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface TimeLog {
   id: string;
   task_id: string;
   project_id: string;
   user_id: string;
   hours: number;
   description: string | null;
   log_date: string;
   created_at: string;
 }
 
 export interface CreateTimeLogData {
   task_id: string;
   project_id: string;
   hours: number;
   description?: string;
   log_date?: string;
 }
 
 export function useTimeLogs(projectId?: string, taskId?: string) {
   const queryClient = useQueryClient();
 
   const { data: logs, isLoading } = useQuery({
     queryKey: ["time-logs", projectId, taskId],
     queryFn: async () => {
       let query = supabase
         .from("time_logs")
         .select("*")
         .order("log_date", { ascending: false });
 
       if (projectId) {
         query = query.eq("project_id", projectId);
       }
       if (taskId) {
         query = query.eq("task_id", taskId);
       }
 
       const { data, error } = await query;
       if (error) throw error;
       return data as TimeLog[];
     },
     enabled: !!projectId || !!taskId,
   });
 
   const createLog = useMutation({
     mutationFn: async (data: CreateTimeLogData) => {
       const { data: user } = await supabase.auth.getUser();
       if (!user.user) throw new Error("Not authenticated");
 
       const { data: result, error } = await supabase
         .from("time_logs")
         .insert({
           ...data,
           user_id: user.user.id,
           log_date: data.log_date || new Date().toISOString().split("T")[0],
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["time-logs"] });
       queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
       toast.success("Time logged successfully");
     },
     onError: (error) => {
       toast.error("Failed to log time: " + error.message);
     },
   });
 
   const deleteLog = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("time_logs").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["time-logs"] });
       queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
       toast.success("Time log removed");
     },
     onError: (error) => {
       toast.error("Failed to remove time log: " + error.message);
     },
   });
 
   // Get total hours for a project
   const totalHours = logs?.reduce((sum, log) => sum + Number(log.hours), 0) || 0;
 
   return {
     logs: logs || [],
     isLoading,
     totalHours,
     createLog,
     deleteLog,
   };
 }
 
 // Hook to get aggregated time data for Vault margin calculations
 export function useProjectTimeSummary() {
   const { data, isLoading } = useQuery({
     queryKey: ["project-time-summary"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("time_logs")
         .select(`
           project_id,
           hours,
           projects:projects(title, client_id)
         `);
 
       if (error) throw error;
 
       // Aggregate hours by project
       const projectHours: Record<string, { totalHours: number; title: string }> = {};
       data?.forEach((log: any) => {
         const pid = log.project_id;
         if (!projectHours[pid]) {
           projectHours[pid] = {
             totalHours: 0,
             title: log.projects?.title || "Unknown Project",
           };
         }
         projectHours[pid].totalHours += Number(log.hours);
       });
 
       return projectHours;
     },
   });
 
   return { projectHours: data || {}, isLoading };
 }