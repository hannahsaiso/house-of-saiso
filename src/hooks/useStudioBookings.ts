import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStaffUserId, notifyAdminNewBooking } from "./useStudioOperations";

export interface StudioBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_type: string;
  event_name: string | null;
  status: string | null;
  notes: string | null;
  equipment_notes: string | null;
  is_blocked: boolean;
  client_id: string | null;
  booked_by: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    company: string | null;
  } | null;
}

export interface CreateBookingData {
  date: string;
  start_time: string;
  end_time: string;
  booking_type: string;
  event_name?: string;
  status?: string;
  notes?: string;
  equipment_notes?: string;
  is_blocked?: boolean;
  client_id?: string;
}

export function useStudioBookings(month?: Date) {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ["studio-bookings", month?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("studio_bookings")
        .select(`
          *,
          client:clients(name, company)
        `)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (month) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        query = query
          .gte("date", startOfMonth.toISOString().split("T")[0])
          .lte("date", endOfMonth.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudioBooking[];
    },
  });

  const createBooking = useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("studio_bookings")
        .insert({
          ...data,
          booked_by: user.user?.id,
          status: data.status || "pending",
        })
        .select()
        .single();
      if (error) throw error;
      
      // Notify admin of new booking for approval
      if (result) {
        await notifyAdminNewBooking(result.id, data.event_name || data.booking_type);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Booking created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create booking: " + error.message);
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateBookingData> & { id: string }) => {
      const previousBooking = bookings?.find((b) => b.id === id);
      
      const { data: result, error } = await supabase
        .from("studio_bookings")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      
      // If status changed to confirmed, create operations tasks
      if (data.status === "confirmed" && previousBooking?.status !== "confirmed") {
        const staffId = await getStaffUserId();
        
        // Create studio operations tasks
        const tasksToCreate = [
          { booking_id: id, task_type: "entry_instructions", task_name: "Send Entry Instructions to Client", assigned_to: staffId, status: "pending" },
          { booking_id: id, task_type: "equipment_check", task_name: "Pre-shoot Equipment Check", assigned_to: staffId, status: "pending" },
          { booking_id: id, task_type: "space_reset", task_name: "Post-shoot Space Reset & Cleaning", assigned_to: staffId, status: "pending" },
        ];
        
        await supabase
          .from("studio_operations_tasks")
          .upsert(tasksToCreate, { onConflict: "booking_id,task_type" });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["studio-operations"] });
      toast.success("Booking updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update booking: " + error.message);
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("studio_bookings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Booking deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete booking: " + error.message);
    },
  });

  return {
    bookings: bookings || [],
    isLoading,
    error,
    createBooking,
    updateBooking,
    deleteBooking,
  };
}
