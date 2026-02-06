import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "staff" | "client";

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isAdminOrStaff: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const queryClient = useQueryClient();

  // Listen for auth state changes and invalidate role cache immediately
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
          // Invalidate and refetch role immediately on auth changes
          queryClient.invalidateQueries({ queryKey: ["user-role"] });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !data) return null;
      return data.role as AppRole;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 2, // Retry on failure
  });

  return {
    role: role ?? null,
    isLoading,
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isAdminOrStaff: role === "admin" || role === "staff",
  };
}
