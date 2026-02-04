import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamInvite {
  id: string;
  email: string;
  invited_role: "admin" | "staff" | "client";
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useTeamInvites() {
  const queryClient = useQueryClient();

  const { data: invites, isLoading } = useQuery({
    queryKey: ["team-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeamInvite[];
    },
  });

  const sendInvite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "staff" | "client" }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("team_invites")
        .insert({
          email,
          invited_role: role,
          invited_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      toast.success(`Invitation sent to ${data.email}`);
    },
    onError: (error) => {
      toast.error("Failed to send invite: " + error.message);
    },
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_invites")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      toast.success("Invitation revoked");
    },
    onError: (error) => {
      toast.error("Failed to revoke invite: " + error.message);
    },
  });

  return {
    invites: invites || [],
    isLoading,
    sendInvite,
    revokeInvite,
  };
}
