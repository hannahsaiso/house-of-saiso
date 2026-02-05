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
     const { date, start_time, end_time, booking_type, required_resources } = await req.json();
     
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
 
     const supabase = createClient(supabaseUrl, supabaseKey);
 
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
 
     // Find available inventory alternatives
     const { data: availableInventory } = await supabase
       .from("inventory")
       .select("id, item_name, category")
       .eq("status", "available")
       .limit(5);
 
     // Generate AI suggestion using Lovable AI
     let aiSuggestion = "";
     if (lovableApiKey) {
       const conflictInfo = conflicts?.map(c => `${c.event_name} (${c.start_time}-${c.end_time})`).join(", ") || "";
       const resourceInfo = unavailableResources.join(", ");
       const alternativeResources = availableInventory?.map(i => `${i.item_name} (${i.category})`).join(", ") || "";
       
       const prompt = `You are a helpful studio booking assistant. A user is trying to book a ${booking_type} session on ${date} from ${start_time} to ${end_time}.
 
 ${conflicts && conflicts.length > 0 ? `Time conflicts: ${conflictInfo}` : ""}
 ${resourceInfo ? `Unavailable resources: ${resourceInfo}` : ""}
 ${alternativeResources ? `Available alternatives: ${alternativeResources}` : ""}
 
 Provide a brief, helpful suggestion (max 2 sentences) for an alternative. Be specific and professional. Suggest a different time or alternative equipment if available.`;
 
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
               { role: "system", content: "You are a concise, professional studio booking assistant." },
               { role: "user", content: prompt }
             ],
             max_tokens: 150,
           }),
         });
 
         if (aiResponse.ok) {
           const aiData = await aiResponse.json();
           aiSuggestion = aiData.choices?.[0]?.message?.content || "";
         }
       } catch (aiError) {
         console.error("AI suggestion error:", aiError);
         // Fall back to basic suggestion
         aiSuggestion = unavailableResources.length > 0 
           ? `Some resources are unavailable. Consider alternatives: ${alternativeResources}`
           : "This time slot is booked. Try a different time.";
       }
     } else {
       aiSuggestion = unavailableResources.length > 0
         ? `Resources unavailable: ${unavailableResources.join(", ")}`
         : "Time slot conflict detected. Please choose another time.";
     }
 
     return new Response(
       JSON.stringify({
         hasConflict: true,
         conflicts: conflicts || [],
         unavailableResources,
         suggestion: aiSuggestion,
         availableAlternatives: availableInventory || [],
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