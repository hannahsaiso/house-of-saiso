import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateCreativeBrief(clientData: Record<string, any>): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured, skipping brief generation");
    return null;
  }

  const prompt = `You are a senior creative strategist at a premium branding agency called House of Saiso.

Based on the following client onboarding data, generate a comprehensive Creative Brief and Pitch Deck Outline.

CLIENT DATA:
- Company: ${clientData.companyName}
- Contact: ${clientData.contactName}
- Email: ${clientData.contactEmail}
- Website: ${clientData.website || "N/A"}
- Instagram: ${clientData.instagram || "N/A"}
- LinkedIn: ${clientData.linkedin || "N/A"}
- Project Goals: ${clientData.projectGoals || "Not specified"}
- Services Needed: ${(clientData.servicesNeeded || []).join(", ") || "Not specified"}
- Additional Notes: ${clientData.finalNotes || "None"}

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

## Creative Brief

### Brand Overview
[2-3 sentence summary of the client's brand identity and market position]

### Project Objectives
[3-5 bullet points of clear, measurable objectives based on their goals]

### Target Audience
[Define the primary and secondary audience segments]

### Tone & Voice
[Recommended brand tone, communication style, and personality]

### Key Deliverables
[List the specific deliverables based on services requested]

### Strategic Recommendations
[3-4 strategic recommendations for maximizing project impact]

---

## Pitch Deck Outline

1. **Cover Slide** — Project title and client branding
2. **The Opportunity** — Market context and why this matters now
3. **Brand Audit** — Current state analysis
4. **Strategic Direction** — Our recommended approach
5. **Creative Concepts** — 2-3 initial directions to explore
6. **Scope & Deliverables** — What we'll produce
7. **Timeline & Milestones** — Phased delivery plan
8. **Investment** — Pricing framework
9. **Next Steps** — Immediate action items`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return null;
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("AI brief generation failed:", error);
    return null;
  }
}

async function triggerMakeWebhook(
  supabaseAdmin: any,
  projectId: string,
  clientData: Record<string, any>
): Promise<void> {
  const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL");
  if (!MAKE_WEBHOOK_URL) {
    console.error("MAKE_WEBHOOK_URL not configured, skipping automation");
    return;
  }

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        company_name: clientData.companyName,
        contact_name: clientData.contactName,
        contact_email: clientData.contactEmail,
        services_needed: clientData.servicesNeeded || [],
        project_goals: clientData.projectGoals || "",
      }),
    });

    if (!response.ok) {
      console.error("Make.com webhook error:", response.status, await response.text());
      return;
    }

    const result = await response.json();

    // If Make.com returns a google_drive_link, save it silently
    if (result?.google_drive_link) {
      await supabaseAdmin
        .from("projects")
        .update({ automated_folder_link: result.google_drive_link })
        .eq("id", projectId);
      console.log(`Drive link saved for project ${projectId}`);
    }
  } catch (error) {
    console.error("Make.com webhook failed:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      companyName, contactName, contactEmail, contactPhone,
      instagram, linkedin, website, projectGoals,
      servicesNeeded, brandAssetsFolder, finalNotes,
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

    // Return success immediately — background tasks run after response
    const responsePayload = { success: true, clientId: client.id, projectId: project.id };

    // Fire-and-forget: AI brief + Make.com webhook run in parallel, silently
    (async () => {
      try {
        await Promise.allSettled([
          // Generate AI creative brief
          (async () => {
            const brief = await generateCreativeBrief(body);
            if (brief) {
              await supabaseAdmin
                .from("projects")
                .update({ ai_creative_brief: brief })
                .eq("id", project.id);
              console.log(`Creative brief saved for project ${project.id}`);
            }
          })(),
          // Trigger Make.com webhook (Drive folder + Slack notification)
          triggerMakeWebhook(supabaseAdmin, project.id, body),
        ]);
      } catch (err) {
        console.error("Background automation failed:", err);
      }
    })();

    return new Response(
      JSON.stringify(responsePayload),
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
