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
     const { date, start_time, end_time, booking_type, required_resources, required_tags } = await req.json();
     
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
 
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     console.log("Smart booking check:", { date, start_time, end_time, booking_type, required_resources, required_tags });
 
     // Check for booking conflicts
     const { data: conflicts, error: conflictError } = await supabase
       .from("studio_bookings")
       .select("id, event_name, start_time, end_time, booking_type")
       .eq("date", date)
       .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`);
 
     if (conflictError) {
       console.error("Conflict check error:", conflictError);
       throw conflictError;
     }
 
     // Get required resource details including tags
     let requiredResourceDetails: any[] = [];
     let requiredResourceTags: string[] = required_tags || [];
     
     if (required_resources && required_resources.length > 0) {
       const { data: resourceData } = await supabase
         .from("inventory")
         .select("id, item_name, category, tags, status")
         .in("id", required_resources);
       
       if (resourceData) {
         requiredResourceDetails = resourceData;
         // Collect all unique tags from required resources
         resourceData.forEach((r: any) => {
           if (r.tags && Array.isArray(r.tags)) {
             r.tags.forEach((tag: string) => {
               if (!requiredResourceTags.includes(tag)) {
                 requiredResourceTags.push(tag);
               }
             });
           }
         });
       }
     }
 
     console.log("Required resource tags:", requiredResourceTags);
 
     // Check inventory availability if resources are specified
     let unavailableResources: string[] = [];
     if (required_resources && required_resources.length > 0) {
       const { data: reservations } = await supabase
         .from("inventory_reservations")
         .select("inventory_id, inventory:inventory(item_name)")
         .in("inventory_id", required_resources)
         .lte("reserved_from", date)
         .gte("reserved_until", date);
 
       if (reservations) {
         unavailableResources = reservations.map((r: any) => r.inventory?.item_name || r.inventory_id);
       }
     }
 
     // If no conflicts, return success
     if ((!conflicts || conflicts.length === 0) && unavailableResources.length === 0) {
       return new Response(
         JSON.stringify({ hasConflict: false, suggestion: null }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Find alternative slots
     const { data: allBookings } = await supabase
       .from("studio_bookings")
       .select("start_time, end_time")
       .eq("date", date)
       .order("start_time");
 
     // Find available inventory alternatives WITH MATCHING TAGS
     // Only suggest alternatives that have at least one of the required tags
     let alternativesQuery = supabase
       .from("inventory")
       .select("id, item_name, category, tags")
       .eq("status", "available");
 
     const { data: allAvailableInventory } = await alternativesQuery;
 
     // Filter alternatives to only include those with matching tags
     let matchingAlternatives: any[] = [];
     if (allAvailableInventory && requiredResourceTags.length > 0) {
       matchingAlternatives = allAvailableInventory.filter((item: any) => {
         if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
           return false;
         }
         // Check if this item shares at least one tag with required tags
         return item.tags.some((tag: string) => requiredResourceTags.includes(tag));
       });
     } else if (allAvailableInventory) {
       // If no specific tags required, show first 5 alternatives
       matchingAlternatives = allAvailableInventory.slice(0, 5);
     }
 
     console.log("Matching alternatives with tags:", matchingAlternatives);
 
     // Generate AI suggestion using Lovable AI
     let aiSuggestion = "";
     if (lovableApiKey) {
       const conflictInfo = conflicts?.map(c => `${c.event_name} (${c.start_time}-${c.end_time})`).join(", ") || "";
       const resourceInfo = unavailableResources.join(", ");
       const requiredTagsInfo = requiredResourceTags.length > 0 ? requiredResourceTags.join(", ") : "None specified";
       const alternativeResources = matchingAlternatives.map(i => {
         const itemTags = i.tags && Array.isArray(i.tags) ? i.tags.join(", ") : "no tags";
         return `${i.item_name} (${i.category}, tags: ${itemTags})`;
       }).join("; ") || "None available with matching features";
       
       const prompt = `You are a helpful studio booking assistant. A user is trying to book a ${booking_type} session on ${date} from ${start_time} to ${end_time}.
 
 REQUIRED FEATURES/TAGS: ${requiredTagsInfo}
 
 ${conflicts && conflicts.length > 0 ? `TIME CONFLICTS: ${conflictInfo}` : ""}
 ${resourceInfo ? `UNAVAILABLE RESOURCES: ${resourceInfo}` : ""}
 
 AVAILABLE ALTERNATIVES WITH MATCHING FEATURES: ${alternativeResources}
 
 IMPORTANT: Only suggest alternatives that have the same features/tags as the original booking requirements (e.g., if they need "Natural Light", only suggest rooms with "Natural Light" tag). 
 
 Provide a brief, helpful suggestion (max 2 sentences) for an alternative. Be specific and professional. If no alternatives match the requirements, say so clearly.`;
 
       try {
         const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
           method: "POST",
           headers: {
             Authorization: `Bearer ${lovableApiKey}`,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             model: "google/gemini-3-flash-preview",
             messages: [
               { role: "system", content: "You are a concise, professional studio booking assistant. You MUST only suggest alternatives that match the original requirements and feature tags." },
               { role: "user", content: prompt }
             ],
             max_tokens: 200,
           }),
         });
 
         if (aiResponse.ok) {
           const aiData = await aiResponse.json();
           aiSuggestion = aiData.choices?.[0]?.message?.content || "";
         }
       } catch (aiError) {
         console.error("AI suggestion error:", aiError);
         // Fall back to basic suggestion with tag-awareness
         if (matchingAlternatives.length > 0) {
           const altNames = matchingAlternatives.map(a => a.item_name).join(", ");
           aiSuggestion = `Some resources are unavailable. Consider these alternatives with matching features: ${altNames}`;
         } else {
           aiSuggestion = "No alternatives with matching features are currently available. Consider adjusting your requirements or selecting a different time.";
         }
       }
     } else {
       if (matchingAlternatives.length > 0) {
         const altNames = matchingAlternatives.map(a => a.item_name).join(", ");
         aiSuggestion = unavailableResources.length > 0
           ? `Resources unavailable. Matching alternatives: ${altNames}`
           : `Time slot conflict. Consider: ${altNames}`;
       } else {
         aiSuggestion = "No alternatives with matching features available.";
       }
     }
 
     return new Response(
       JSON.stringify({
         hasConflict: true,
         conflicts: conflicts || [],
         unavailableResources,
         suggestion: aiSuggestion,
         availableAlternatives: matchingAlternatives,
         requiredTags: requiredResourceTags,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Smart booking error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });