import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialEntry {
  id: string;
  date: string;
  client_id: string | null;
  project_id: string | null;
  service_type: "agency" | "studio";
  description: string | null;
  amount: number;
  payment_status: "sent" | "paid" | "overdue";
  stripe_invoice_id: string | null;
  stripe_payment_link: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    company: string | null;
  } | null;
  project?: {
    title: string;
  } | null;
}

export interface CreateFinancialEntryData {
  date: string;
  client_id?: string;
  project_id?: string;
  service_type: "agency" | "studio";
  description?: string;
  amount: number;
  payment_status?: "sent" | "paid" | "overdue";
}

export function useFinancialEntries() {
  const queryClient = useQueryClient();

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ["financial-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          client:clients(name, company),
          project:projects(title)
        `)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as FinancialEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (data: CreateFinancialEntryData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("financial_entries")
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Entry created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create entry: " + error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateFinancialEntryData> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("financial_entries")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Entry updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update entry: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Entry deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete entry: " + error.message);
    },
  });

  // Calculate monthly totals for chart
  const monthlyTotals = entries?.reduce((acc, entry) => {
    const month = entry.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { agency: 0, studio: 0, total: 0 };
    }
    acc[month][entry.service_type] += Number(entry.amount);
    acc[month].total += Number(entry.amount);
    return acc;
  }, {} as Record<string, { agency: number; studio: number; total: number }>);

  return {
    entries: entries || [],
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    monthlyTotals: monthlyTotals || {},
  };
}
