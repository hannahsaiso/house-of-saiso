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
    const body = await req.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      instagram,
      linkedin,
      website,
      projectGoals,
      servicesNeeded,
      brandAssetsFolder,
      finalNotes,
    } = body;

    if (!companyName || !contactName || !contactEmail) {
      return new Response(
        JSON.stringify({ error: "Company name, contact name, and email are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert({
        name: contactName,
        company: companyName,
        email: contactEmail,
        phone: contactPhone || null,
        instagram_handle: instagram || null,
        linkedin_url: linkedin || null,
        website_url: website || null,
        project_goals: projectGoals || null,
        services_needed: servicesNeeded || [],
        brand_assets_folder: brandAssetsFolder || null,
        notes: finalNotes || null,
        onboarded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // Create initial project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        title: `${companyName} - Initial Project`,
        description: projectGoals || null,
        client_id: client.id,
        status: "active",
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Notify admin/staff
    const { data: adminStaff } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "staff"]);

    if (adminStaff && adminStaff.length > 0) {
      const notifications = adminStaff.map((role: any) => ({
        user_id: role.user_id,
        type: "client_onboarded",
        title: "New Client Onboarded",
        message: `${companyName} has completed their onboarding.`,
        data: { client_id: client.id, project_id: project.id },
      }));

      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, clientId: client.id, projectId: project.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Onboarding submission error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit onboarding." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
