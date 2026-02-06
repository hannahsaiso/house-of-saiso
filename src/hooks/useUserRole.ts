import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
  const isMounted = useRef(true);

  // Query must come before effects to maintain consistent hook order
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
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Listen for auth state changes and invalidate role cache
  useEffect(() => {
    isMounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (!isMounted.current) return;
        
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
          // Use setTimeout to avoid React state update conflicts
          setTimeout(() => {
            if (isMounted.current) {
              queryClient.invalidateQueries({ queryKey: ["user-role"] });
            }
          }, 0);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    role: role ?? null,
    isLoading,
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isAdminOrStaff: role === "admin" || role === "staff",
  };
}
