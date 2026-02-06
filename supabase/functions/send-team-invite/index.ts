import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendInviteRequest {
  inviteId: string;
  inviterName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Get auth header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Only admins can send invites");
    }

    const { inviteId, inviterName }: SendInviteRequest = await req.json();

    if (!inviteId) {
      throw new Error("Missing inviteId");
    }

    // Get invite details
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invite not found");
    }

    // Get inviter's Google OAuth token
    const { data: oauthToken, error: tokenError } = await supabaseAdmin
      .from("google_oauth_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !oauthToken) {
      console.log("No Google OAuth token found, returning manual invite instructions");
      return new Response(
        JSON.stringify({
          success: false,
          needsGoogleAuth: true,
          message: "Please connect your Google Workspace account in Settings > Integrations to send emails automatically.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token needs refresh
    let accessToken = oauthToken.access_token;
    if (oauthToken.token_expires_at && new Date(oauthToken.token_expires_at) < new Date()) {
      // Token expired, try to refresh
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      
      if (!clientId || !clientSecret || !oauthToken.refresh_token) {
        return new Response(
          JSON.stringify({
            success: false,
            needsGoogleAuth: true,
            message: "Google token expired. Please reconnect your Google account.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: oauthToken.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            needsGoogleAuth: true,
            message: "Failed to refresh Google token. Please reconnect your Google account.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update stored token
      await supabaseAdmin
        .from("google_oauth_tokens")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Build invite URL
    const origin = req.headers.get("origin") || "https://id-preview--ce1e24b2-4533-48ea-8723-8a63efc35297.lovable.app";
    const inviteUrl = `${origin}/join/${invite.token}`;

    // Create email content
    const emailSubject = `You're invited to join House of Saiso`;
    const senderName = inviterName || "House of Saiso Team";
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #eee;">
              <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 50%; line-height: 64px; color: #fff; font-weight: bold; font-size: 24px; font-family: Georgia, serif;">HS</div>
              <h1 style="margin: 16px 0 0; color: #1a1a2e; font-size: 24px; font-weight: 600; font-family: Georgia, serif;">House of Saiso</h1>
              <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Creative Studio Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 600;">You're Invited! 🎉</h2>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${senderName} has invited you to join the House of Saiso team as a <strong style="color: #1f2937; text-transform: capitalize;">${invite.invited_role}</strong>.
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #2563eb; font-size: 13px; text-decoration: none;">${inviteUrl}</a>
              </p>
              
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                This invitation expires in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #eee; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} House of Saiso. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Encode email in base64url format for Gmail API
    const emailMessage = [
      `To: ${invite.email}`,
      `Subject: ${emailSubject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailHtml,
    ].join("\r\n");

    const encodedMessage = btoa(unescape(encodeURIComponent(emailMessage)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email via Gmail API
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.text();
      console.error("Gmail API error:", errorData);
      
      // Check if it's a scope/permission issue
      if (gmailResponse.status === 403 || gmailResponse.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            needsGoogleAuth: true,
            message: "Gmail permissions not granted. Please reconnect Google with email sending permissions.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gmail API error: ${gmailResponse.status}`);
    }

    console.log("Invite email sent successfully to:", invite.email);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-team-invite:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
