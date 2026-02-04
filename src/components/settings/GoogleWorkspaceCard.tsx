import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { Loader2, Link2, Unlink, Mail, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export function GoogleWorkspaceCard() {
  const { connection, isLoading, isConnected, isTokenExpired, disconnect, isDisconnecting, saveToken, isSaving } = useGoogleOAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google OAuth is not configured. Please add VITE_GOOGLE_CLIENT_ID.");
      return;
    }

    setIsConnecting(true);

    try {
      // Build OAuth URL
      const redirectUri = `${window.location.origin}/settings/integrations/callback`;
      const state = crypto.randomUUID();
      
      // Store state for CSRF protection
      sessionStorage.setItem("google_oauth_state", state);

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GOOGLE_SCOPES);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("OAuth error:", error);
      toast.error("Failed to initiate connection");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect Google Workspace?")) {
      disconnect();
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 transition-all hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Google Workspace Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <CardTitle className="font-heading text-lg font-medium">
                Google Workspace
              </CardTitle>
              <CardDescription className="mt-1">
                Access Gmail and Calendar from within the app.
              </CardDescription>
            </div>
          </div>

          {isConnected && !isTokenExpired && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Connected
            </Badge>
          )}
          {isConnected && isTokenExpired && (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              Expired
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isConnected ? (
          <>
            {/* Connected Account Info */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-heading text-sm font-semibold text-primary">
                    {connection?.google_email?.[0]?.toUpperCase() || "G"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{connection?.google_email || "Connected Account"}</p>
                  <p className="text-xs text-muted-foreground">
                    Syncing Gmail & Calendar
                  </p>
                </div>
              </div>
            </div>

            {/* Connected Services */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Gmail Inbox</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Google Calendar</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isTokenExpired && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || isSaving}
                  className="flex-1"
                >
                  {isConnecting || isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Reconnect Account
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className={isTokenExpired ? "" : "flex-1"}
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="mr-2 h-4 w-4" />
                )}
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>View and manage your Gmail inbox</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Sync Google Calendar with Studio bookings</span>
              </div>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isSaving}
              className="w-full"
            >
              {isConnecting || isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Link Workspace Account
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
