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

  const removePendingMember = useMutation({
    mutationFn: async (email: string) => {
      // Delete from team_members table
      const { error: memberError } = await supabase
        .from("team_members")
        .delete()
        .eq("email", email)
        .eq("status", "pending");
      if (memberError) throw memberError;

      // Also revoke the invite if it exists
      const { error: inviteError } = await supabase
        .from("team_invites")
        .delete()
        .eq("email", email)
        .is("accepted_at", null);
      if (inviteError) console.warn("Could not delete invite:", inviteError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      toast.success("Pending member removed");
    },
    onError: (error) => {
      toast.error("Failed to remove member: " + error.message);
    },
  });

  return {
    teamMembers: teamMembers || [],
    isLoading,
    updateTeamMemberRole,
    removePendingMember,
  };
}
