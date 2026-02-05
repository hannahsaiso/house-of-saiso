import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "./useProfile";

interface GoogleOAuthToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  google_email: string | null;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useGoogleOAuth() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const { data: connection, isLoading, error } = useQuery({
    queryKey: ["google-oauth-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("google_oauth_tokens")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GoogleOAuthToken | null;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("google_oauth_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-oauth-connection"] });
      toast.success("Google Workspace disconnected");
    },
    onError: (error) => {
      toast.error("Failed to disconnect: " + error.message);
    },
  });

  const saveTokenMutation = useMutation({
    mutationFn: async (tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      google_email?: string;
      scopes?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("google_oauth_tokens")
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          google_email: tokenData.google_email || null,
          scopes: tokenData.scopes || null,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      // Trigger zero-config staff folder setup
      try {
        const staffName = profile?.full_name || user.email?.split("@")[0] || "Staff";
        await supabase.functions.invoke("setup-staff-drive", {
          body: { user_id: user.id, staff_name: staffName },
        });
        console.log("Staff drive folders created automatically");
      } catch (setupError) {
        // Don't fail the connection if folder setup fails
        console.error("Optional staff folder setup failed:", setupError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-oauth-connection"] });
      toast.success("Google Workspace connected! Drive folders created automatically.");
    },
    onError: (error) => {
      toast.error("Failed to save connection: " + error.message);
    },
  });

  const isConnected = !!connection?.access_token;
  const isTokenExpired = connection?.token_expires_at
    ? new Date(connection.token_expires_at) < new Date()
    : false;

  return {
    connection,
    isLoading,
    error,
    isConnected,
    isTokenExpired,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    saveToken: saveTokenMutation.mutateAsync,
    isSaving: saveTokenMutation.isPending,
  };
}
