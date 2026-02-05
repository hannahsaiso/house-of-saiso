import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = "admin" | "staff" | "client";

export interface UserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
}

export function useRoleManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["role-management-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id,email,full_name")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const userIds = (profiles || []).map((p) => p.user_id);
      if (userIds.length === 0) return [] as UserRow[];

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id,user_id,role")
        .in("user_id", userIds);
      if (rolesError) throw rolesError;

      const roleByUserId = new Map<string, AppRole>();
      (roles || []).forEach((r) => {
        // If duplicates exist, last one wins; app assumes one role.
        roleByUserId.set(r.user_id, r.role as AppRole);
      });

      return (profiles || []).map((p) => ({
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        role: roleByUserId.get(p.user_id) ?? null,
      })) as UserRow[];
    },
  });

  const setUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Try update existing row first.
      const { data: existing, error: existingError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("id", existing.id);
        if (updateError) throw updateError;
        return;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-management-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-role"] });
      toast.success("User role updated");
    },
    onError: (error) => {
      toast.error("Failed to update user role: " + error.message);
    },
  });

  return {
    users: users || [],
    isLoading,
    setUserRole,
  };
}
