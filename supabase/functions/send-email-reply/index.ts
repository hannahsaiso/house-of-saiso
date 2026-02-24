import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { threadId, toAddress, messageBody, subject } = await req.json();

    if (!threadId || !toAddress || !messageBody) {
      return new Response(
        JSON.stringify({ error: "threadId, toAddress, and messageBody are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the user's Google OAuth token
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenRow, error: tokenError } = await adminClient
      .from("google_oauth_tokens")
      .select("access_token, google_email")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(
        JSON.stringify({ error: "Google account not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build RFC 2822 email
    const replySubject = subject?.startsWith("Re:") ? subject : `Re: ${subject || ""}`;
    const rawEmail = [
      `From: ${tokenRow.google_email}`,
      `To: ${toAddress}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${threadId}`,
      `References: ${threadId}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      messageBody,
    ].join("\r\n");

    // Base64url encode
    const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const gmailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRow.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded, threadId }),
      }
    );

    if (!gmailRes.ok) {
      const errBody = await gmailRes.text();
      console.error("Gmail API error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailData = await gmailRes.json();

    // Log the sent email
    await adminClient.from("sent_emails").insert({
      user_id: userId,
      thread_id: threadId,
      to_address: toAddress,
      subject: replySubject,
      body: messageBody,
      gmail_message_id: gmailData.id,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: gmailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email-reply error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
