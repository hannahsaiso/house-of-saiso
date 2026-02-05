import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TeamMemberStatus = "pending" | "active" | "disabled";

export interface TeamMember {
  id: string;
  email: string;
  status: TeamMemberStatus;
  invited_role: "admin" | "staff" | "client";
  invite_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTeamMembers() {
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

  const updateTeamMemberRole = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "staff" }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ invited_role: role })
        .eq("email", email);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Role updated");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  return {
    teamMembers: teamMembers || [],
    isLoading,
    updateTeamMemberRole,
  };
}
