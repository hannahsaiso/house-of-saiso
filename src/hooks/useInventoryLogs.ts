 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface InventoryLog {
   id: string;
   inventory_id: string;
   log_type: "used" | "repaired" | "cleaned" | "flagged_maintenance" | "cleared_maintenance";
   description: string;
   project_id: string | null;
   booking_id: string | null;
   performed_by: string | null;
   performed_by_name: string | null;
   log_date: string;
   created_at: string;
   created_by: string | null;
 }
 
 export function useInventoryLogs(inventoryId?: string) {
   const queryClient = useQueryClient();
 
   const { data: logs, isLoading } = useQuery({
     queryKey: ["inventory-logs", inventoryId],
     queryFn: async () => {
       let query = supabase
         .from("inventory_logs")
         .select("*")
         .order("log_date", { ascending: false })
         .order("created_at", { ascending: false });
 
       if (inventoryId) {
         query = query.eq("inventory_id", inventoryId);
       }
 
       const { data, error } = await query.limit(50);
       if (error) throw error;
       return data as InventoryLog[];
     },
     enabled: !!inventoryId,
   });
 
   const createLog = useMutation({
     mutationFn: async (data: Omit<InventoryLog, "id" | "created_at" | "created_by">) => {
       const { data: user } = await supabase.auth.getUser();
       const { data: result, error } = await supabase
         .from("inventory_logs")
         .insert({ ...data, created_by: user.user?.id })
         .select()
         .single();
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["inventory-logs"] });
     },
     onError: (error) => {
       toast.error("Failed to create log: " + error.message);
     },
   });
 
   return {
     logs: logs || [],
     isLoading,
     createLog,
   };
 }