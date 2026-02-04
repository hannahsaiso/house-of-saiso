import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const IntegrationsCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveToken } = useGoogleOAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      // Check for OAuth errors
      if (error) {
        setStatus("error");
        setErrorMessage(error === "access_denied" ? "Access was denied" : error);
        return;
      }

      // Validate state for CSRF protection
      const storedState = sessionStorage.getItem("google_oauth_state");
      if (!state || state !== storedState) {
        setStatus("error");
        setErrorMessage("Invalid state parameter");
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code received");
        return;
      }

      try {
        // Exchange code for tokens via edge function
        const { data, error: fnError } = await supabase.functions.invoke("google-oauth-callback", {
          body: { 
            code,
            redirect_uri: `${window.location.origin}/settings/integrations/callback`
          },
        });

        if (fnError) throw fnError;

        if (data.error) {
          throw new Error(data.error);
        }

        // Save tokens to database
        await saveToken({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          google_email: data.email,
          scopes: data.scope?.split(" ") || [],
        });

        setStatus("success");
        sessionStorage.removeItem("google_oauth_state");

        // Redirect after success
        setTimeout(() => {
          navigate("/settings/integrations");
        }, 1500);
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Failed to complete authentication");
      }
    };

    handleCallback();
  }, [searchParams, navigate, saveToken]);

  return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h2 className="mt-6 font-heading text-xl font-medium">
                Connecting your account...
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we complete the setup.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 font-heading text-xl font-medium">
                Successfully Connected
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Redirecting you back...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="mt-6 font-heading text-xl font-medium">
                Connection Failed
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <button
                onClick={() => navigate("/settings/integrations")}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Return to Settings
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsCallback;
