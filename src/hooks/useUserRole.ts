import { useQuery } from "@tanstack/react-query";
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
    refetchOnWindowFocus: false,
  });

  return {
    role: role ?? null,
    isLoading,
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isAdminOrStaff: role === "admin" || role === "staff",
  };
}
