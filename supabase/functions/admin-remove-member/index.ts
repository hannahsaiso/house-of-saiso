import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = claims.claims.sub;

    // Verify user is admin
    const { data: isAdmin, error: adminError } = await supabaseUser.rpc("is_admin", {
      _user_id: adminUserId,
    });

    if (adminError || !isAdmin) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, email } = await req.json();
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ error: "userId or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from removing themselves
    if (userId === adminUserId) {
      return new Response(
        JSON.stringify({ error: "Cannot remove yourself from the team" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let targetUserId = userId;

    // If we only have email, look up the user
    if (!targetUserId && email) {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u) => u.email === email);
      if (user) {
        targetUserId = user.id;
      }
    }

    const results: string[] = [];

    // 1. Delete from user_roles table
    if (targetUserId) {
      const { error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId);
      
      if (rolesError) {
        console.error("Error deleting user roles:", rolesError);
      } else {
        results.push("Removed user roles");
      }

      // 2. Delete from profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", targetUserId);
      
      if (profileError) {
        console.error("Error deleting profile:", profileError);
      } else {
        results.push("Removed profile");
      }

      // 3. Disable the user account in auth.users (soft delete)
      const { error: disableError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { 
          ban_duration: "876600h", // ~100 years
          user_metadata: { disabled: true, disabled_at: new Date().toISOString() }
        }
      );

      if (disableError) {
        console.error("Error disabling user:", disableError);
      } else {
        results.push("Disabled auth account");
      }
    }

    // 4. Delete from team_members table (for both pending and active)
    if (email) {
      const { error: teamMemberError } = await supabaseAdmin
        .from("team_members")
        .delete()
        .eq("email", email);
      
      if (teamMemberError) {
        console.error("Error deleting team member:", teamMemberError);
      } else {
        results.push("Removed from team members");
      }

      // 5. Delete any pending invites
      const { error: inviteError } = await supabaseAdmin
        .from("team_invites")
        .delete()
        .eq("email", email);
      
      if (inviteError) {
        console.error("Error deleting invites:", inviteError);
      } else {
        results.push("Removed pending invites");
      }
    }

    console.log("Member removal completed:", { email, userId: targetUserId, results });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Team member ${email || userId} has been removed`,
        actions: results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-remove-member:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
