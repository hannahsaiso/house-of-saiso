import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarToken {
  id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}

export function usePublicCalendarToken() {
  const queryClient = useQueryClient();

  const { data: tokens, isLoading } = useQuery({
    queryKey: ["calendar-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_calendar_tokens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CalendarToken[];
    },
  });

  const generateToken = useMutation({
    mutationFn: async (expiresInDays?: number) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("public_calendar_tokens")
        .insert({
          created_by: user.user.id,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tokens"] });
      toast.success("Public calendar link generated");
    },
    onError: (error) => {
      toast.error("Failed to generate link: " + error.message);
    },
  });

  const revokeToken = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("public_calendar_tokens")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tokens"] });
      toast.success("Link revoked");
    },
    onError: (error) => {
      toast.error("Failed to revoke link: " + error.message);
    },
  });

  const getPublicUrl = (token: string) => {
    return `${window.location.origin}/calendar/${token}`;
  };

  return {
    tokens: tokens || [],
    isLoading,
    generateToken,
    revokeToken,
    getPublicUrl,
  };
}

// For public view - fetch bookings by token
export async function fetchPublicCalendar(token: string) {
  // Verify token is valid and not expired
  const { data: tokenData, error: tokenError } = await supabase
    .from("public_calendar_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return { valid: false, bookings: [], error: "Invalid or expired link" };
  }

  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, bookings: [], error: "This link has expired" };
  }

  // Fetch bookings (without sensitive client info for public view)
  const { data: bookings, error: bookingsError } = await supabase
    .from("studio_bookings")
    .select("id, date, start_time, end_time, booking_type, status, is_blocked")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (bookingsError) {
    return { valid: false, bookings: [], error: "Failed to load calendar" };
  }

  return { valid: true, bookings, error: null };
}
