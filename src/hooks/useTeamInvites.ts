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
      
      // 1. Create the invite record
      const { data: invite, error } = await supabase
        .from("team_invites")
        .insert({
          email,
          invited_role: role,
          invited_by: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Also create/update a pending team member record for tracking.
      const { error: memberError } = await supabase
        .from("team_members")
        .upsert(
          {
            email,
            status: "pending",
            invited_role: role,
            invite_id: invite.id,
          },
          { onConflict: "email" }
        );

      if (memberError) throw memberError;

      // 3. Try to send email via Gmail API (edge function)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.user?.id)
          .single();

        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          "send-team-invite",
          {
            body: {
              inviteId: invite.id,
              inviterName: profile?.full_name || "House of Saiso Team",
            },
          }
        );

        if (emailError) {
          console.warn("Failed to send invite email:", emailError);
          // Don't throw - invite was still created
        } else if (emailResult?.needsGoogleAuth) {
          toast.info(emailResult.message || "Email not sent - use the Copy Link button instead.");
        } else if (emailResult?.success) {
          toast.success(`Invitation email sent to ${email}`);
          return invite;
        }
      } catch (err) {
        console.warn("Email sending failed:", err);
        // Don't throw - invite was still created
      }

      return invite;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });

      const inviteLink = `${window.location.origin}/join?token=${data.token}`;

      toast.success(`Invitation created for ${data.email}.`, {
        action: {
          label: "Copy link",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(inviteLink);
              toast.success("Invite link copied");
            } catch {
              toast.error("Could not copy invite link");
            }
          },
        },
      });
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
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
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

