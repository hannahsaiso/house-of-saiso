 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const { canvas_id, project_id } = await req.json();
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     if (!lovableApiKey) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Fetch the canvas data
     const { data: canvas, error: canvasError } = await supabase
       .from("project_intake_canvas")
       .select("*")
       .eq("id", canvas_id)
       .single();
 
     if (canvasError || !canvas) {
       throw new Error("Canvas not found");
     }
 
     // Fetch project info
     const { data: project } = await supabase
       .from("projects")
       .select("title, description, client:clients!inner(name, company)")
       .eq("id", project_id)
       .single();
 
     const clientData = Array.isArray(project?.client) ? project.client[0] : project?.client;
 
     // Build prompt for AI
     const systemPrompt = `You are a strategic creative director at a marketing agency. Your role is to synthesize client intake information into a clear, actionable Project Charter that serves as the "Source of Truth" for the creative team.
 
 The Project Charter should be:
 - Professional and strategic in tone
 - Clearly structured with headers
 - Actionable and reference-worthy
 - Concise but comprehensive
 
 Format the charter with these sections:
 1. **Project Overview** - A 2-3 sentence executive summary
 2. **Strategic Goals** - Bullet points of key objectives
 3. **Brand Identity** - Synthesis of brand pillars and tone
 4. **Target Audience** - Who we're speaking to and why
 5. **Competitive Landscape** - Key insights about the market
 6. **Creative Direction** - Recommended approach based on all inputs
 7. **Key Takeaways** - 3-5 critical points the team must remember`;
 
     const userPrompt = `Create a Project Charter for the following client project:
 
 **Client:** ${clientData?.name || "Unknown"} (${clientData?.company || "Unknown Company"})
 **Project:** ${project?.title || "Untitled Project"}
 **Project Description:** ${project?.description || "No description provided"}
 
 **Intake Canvas Data:**
 
 **Project Goals:**
 ${canvas.project_goals || "Not specified"}
 
 **Brand Pillars:**
 ${canvas.brand_pillars?.join(", ") || "Not specified"}
 
 **Tone of Voice:**
 ${canvas.tone_of_voice || "Not specified"}
 
 **Target Audience:**
 ${canvas.target_audience || "Not specified"}
 
 **Competitors:**
 ${canvas.competitors || "Not specified"}
 
 **Visual Inspiration Notes:**
 ${canvas.inspiration_gallery?.length > 0 ? `${canvas.inspiration_gallery.length} reference items provided` : "None provided"}
 
 Please generate a comprehensive Project Charter that the creative team can reference throughout the project.`;
 
     console.log("Calling Lovable AI to generate charter...");
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${lovableApiKey}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: userPrompt },
         ],
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error(`AI gateway error: ${response.status}`);
     }
 
     const aiResponse = await response.json();
     const charter = aiResponse.choices?.[0]?.message?.content;
 
     if (!charter) {
       throw new Error("No charter content generated");
     }
 
     // Get auth user from request
     const authHeader = req.headers.get("Authorization");
     let userId = null;
     if (authHeader) {
       const token = authHeader.replace("Bearer ", "");
       const { data: { user } } = await supabase.auth.getUser(token);
       userId = user?.id;
     }
 
     // Save to knowledge vault
     const { data: vault, error: vaultError } = await supabase
       .from("project_knowledge_vault")
       .upsert({
         project_id: project_id,
         canvas_id: canvas_id,
         project_charter: charter,
         tone_tags: canvas.tone_of_voice ? [canvas.tone_of_voice] : [],
         pillar_tags: canvas.brand_pillars || [],
         is_locked: true,
         generated_at: new Date().toISOString(),
         generated_by: userId,
       }, {
         onConflict: "project_id",
       })
       .select()
       .single();
 
     if (vaultError) {
       console.error("Vault save error:", vaultError);
       throw vaultError;
     }
 
     console.log("Charter generated and saved successfully");
 
     return new Response(
       JSON.stringify({ success: true, vault }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Generate charter error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });