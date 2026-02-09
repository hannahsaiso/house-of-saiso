import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminActions() {
  const queryClient = useQueryClient();

  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { email },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Password reset link generated", {
        description: data.resetLink 
          ? "Link copied to clipboard" 
          : "The user will receive an email shortly",
      });
      
      // Copy reset link to clipboard if available
      if (data.resetLink) {
        navigator.clipboard.writeText(data.resetLink).catch(console.error);
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to reset password", {
        description: error.message,
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ userId, email }: { userId?: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-remove-member", {
        body: { userId, email },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      queryClient.invalidateQueries({ queryKey: ["role-management-users"] });
      
      toast.success("Team member removed", {
        description: "The user has been offboarded from the team",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to remove team member", {
        description: error.message,
      });
    },
  });

  return {
    resetPassword,
    removeMember,
  };
}
