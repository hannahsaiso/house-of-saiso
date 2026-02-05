import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  status: "available" | "in_use" | "maintenance";
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InventoryReservation {
  id: string;
  inventory_id: string;
  booking_id: string;
  reserved_from: string;
  reserved_until: string;
  created_at: string;
  created_by: string | null;
  inventory?: InventoryItem;
}

export function useInventory() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("category", { ascending: true })
        .order("item_name", { ascending: true });

      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (data: Omit<InventoryItem, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("inventory")
        .insert({ ...data, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item added to inventory");
    },
    onError: (error) => {
      toast.error("Failed to add item: " + error.message);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...data }: Partial<InventoryItem> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("inventory")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item updated");
    },
    onError: (error) => {
      toast.error("Failed to update item: " + error.message);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item removed from inventory");
    },
    onError: (error) => {
      toast.error("Failed to delete item: " + error.message);
    },
  });

  return {
    items: items || [],
    isLoading,
    createItem,
    updateItem,
    deleteItem,
  };
}

export function useInventoryReservations(bookingId?: string, dateRange?: { from: string; to: string }) {
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["inventory-reservations", bookingId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("inventory_reservations")
        .select(`
          *,
          inventory:inventory(*)
        `);

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      if (dateRange) {
        query = query
          .lte("reserved_from", dateRange.to)
          .gte("reserved_until", dateRange.from);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryReservation[];
    },
  });

  const createReservation = useMutation({
    mutationFn: async (data: { inventory_id: string; booking_id: string; reserved_from: string; reserved_until: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("inventory_reservations")
        .insert({ ...data, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-reservations"] });
      toast.success("Gear reserved");
    },
    onError: (error) => {
      toast.error("Failed to reserve gear: " + error.message);
    },
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-reservations"] });
      toast.success("Reservation removed");
    },
    onError: (error) => {
      toast.error("Failed to remove reservation: " + error.message);
    },
  });

  // Check availability for a specific date range
  const checkAvailability = async (inventoryIds: string[], dateRange: { from: string; to: string }) => {
    const { data, error } = await supabase
      .from("inventory_reservations")
      .select("inventory_id")
      .in("inventory_id", inventoryIds)
      .lte("reserved_from", dateRange.to)
      .gte("reserved_until", dateRange.from);

    if (error) throw error;
    return data.map((r) => r.inventory_id);
  };

  return {
    reservations: reservations || [],
    isLoading,
    createReservation,
    deleteReservation,
    checkAvailability,
  };
}
