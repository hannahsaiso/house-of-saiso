 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface StudioOperationsTask {
   id: string;
   booking_id: string;
   task_type: string;
   task_name: string;
   assigned_to: string | null;
   status: string;
   completed_at: string | null;
   created_at: string;
   updated_at: string;
 }
 
 // Default operations tasks template
 const OPERATIONS_TASK_TEMPLATE = [
   { task_type: "space_prep", task_name: "Studio Prep: Clean space & check gear" },
 ];
 
 export function useStudioOperations(bookingId?: string) {
   const queryClient = useQueryClient();
 
   const { data: tasks, isLoading } = useQuery({
     queryKey: ["studio-operations", bookingId],
     queryFn: async () => {
       if (!bookingId) return [];
       
       const { data, error } = await supabase
         .from("studio_operations_tasks")
         .select("*")
         .eq("booking_id", bookingId)
         .order("created_at", { ascending: true });
 
       if (error) throw error;
       return data as StudioOperationsTask[];
     },
     enabled: !!bookingId,
   });
 
   const createOperationsTasks = useMutation({
     mutationFn: async ({ bookingId, assignedTo }: { bookingId: string; assignedTo?: string }) => {
       const tasksToCreate = OPERATIONS_TASK_TEMPLATE.map((template) => ({
         booking_id: bookingId,
         task_type: template.task_type,
         task_name: template.task_name,
         assigned_to: assignedTo || null,
         status: "pending",
       }));
 
       const { data, error } = await supabase
         .from("studio_operations_tasks")
         .upsert(tasksToCreate, { onConflict: "booking_id,task_type" })
         .select();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["studio-operations"] });
       toast.success("Studio operations tasks created");
     },
     onError: (error) => {
       toast.error("Failed to create operations tasks: " + error.message);
     },
   });
 
   const updateTaskStatus = useMutation({
     mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
       const updates: any = { status };
       if (status === "completed") {
         updates.completed_at = new Date().toISOString();
       }
 
       const { error } = await supabase
         .from("studio_operations_tasks")
         .update(updates)
         .eq("id", taskId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["studio-operations"] });
     },
   });
 
   return {
     tasks: tasks || [],
     isLoading,
     createOperationsTasks,
     updateTaskStatus,
   };
 }
 
 // Helper to get the first staff user ID for auto-assignment
 export async function getStaffUserId(): Promise<string | null> {
   const { data } = await supabase
     .from("user_roles")
     .select("user_id")
     .eq("role", "staff")
     .limit(1)
     .single();
   
   return data?.user_id || null;
 }
 
 // Helper to notify admin of new booking
 export async function notifyAdminNewBooking(bookingId: string, eventName: string) {
   // Get all admin user IDs
   const { data: admins } = await supabase
     .from("user_roles")
     .select("user_id")
     .eq("role", "admin");
 
   if (!admins || admins.length === 0) return;
 
   // Create notification for each admin
   const notifications = admins.map((admin) => ({
     user_id: admin.user_id,
     type: "booking_approval",
     title: "New Venue Rental Inquiry",
     message: `Confirm Space & Gear Availability for "${eventName || "Studio Rental"}"`,
     data: { booking_id: bookingId },
   }));
 
   await supabase.from("notifications").insert(notifications);
 }