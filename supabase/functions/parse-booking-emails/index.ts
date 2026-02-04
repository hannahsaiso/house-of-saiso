import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const BOOKING_KEYWORDS = ["booking", "reservation", "studio request", "book", "schedule", "rental"];

interface ParsedBooking {
  client_name: string | null;
  email: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  event_name: string | null;
  notes: string | null;
}

async function parseBookingWithAI(emailContent: string, emailSubject: string): Promise<ParsedBooking> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY not configured");
    throw new Error("AI service not configured");
  }

  const systemPrompt = `You are an AI assistant that extracts booking information from emails sent to a creative studio.
Extract the following details and return them as JSON:
- client_name: The name of the person or company requesting the booking
- email: Their email address if mentioned
- date: The requested date in YYYY-MM-DD format
- start_time: The requested start time in HH:MM format (24-hour)
- end_time: The requested end time in HH:MM format (24-hour)
- event_name: Brief description of what the booking is for (e.g., "Product Photography", "Video Shoot")
- notes: Any additional requirements or equipment needs mentioned

If a field cannot be determined from the email, use null.
For time ranges like "all day", use start_time: "09:00" and end_time: "18:00".
Only return valid JSON, no other text.`;

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Subject: ${emailSubject}\n\nEmail Body:\n${emailContent}` },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("AI parsing error:", error);
    throw new Error("Failed to parse booking with AI");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", content);
    return {
      client_name: null,
      email: null,
      date: null,
      start_time: null,
      end_time: null,
      event_name: null,
      notes: content,
    };
  }
}

function containsBookingKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BOOKING_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return new Response(
        JSON.stringify({ error: "emails array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const email of emails) {
      const { subject, body, from } = email;

      // Check if email contains booking-related keywords
      const combinedText = `${subject || ""} ${body || ""}`;
      if (!containsBookingKeywords(combinedText)) {
        console.log(`Skipping email "${subject}" - no booking keywords found`);
        continue;
      }

      console.log(`Processing booking email: "${subject}"`);

      // Parse booking details with AI
      const parsed = await parseBookingWithAI(body || "", subject || "");

      // Skip if we couldn't extract a date
      if (!parsed.date) {
        console.log(`Skipping email "${subject}" - no date extracted`);
        results.push({ subject, status: "skipped", reason: "no_date" });
        continue;
      }

      // Look up or create client if email provided
      let clientId = null;
      if (parsed.email || from) {
        const clientEmail = parsed.email || from;
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("email", clientEmail)
          .single();

        if (existingClient) {
          clientId = existingClient.id;
        } else if (parsed.client_name) {
          // Create new client
          const { data: newClient } = await supabase
            .from("clients")
            .insert({
              name: parsed.client_name,
              email: clientEmail,
            })
            .select("id")
            .single();
          clientId = newClient?.id;
        }
      }

      // Create draft booking
      const { data: booking, error } = await supabase
        .from("studio_bookings")
        .insert({
          date: parsed.date,
          start_time: parsed.start_time || "09:00",
          end_time: parsed.end_time || "18:00",
          booking_type: parsed.event_name || "Studio Rental",
          event_name: parsed.event_name,
          client_id: clientId,
          notes: parsed.notes,
          status: "pending", // Draft status for admin approval
          is_blocked: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create booking:", error);
        results.push({ subject, status: "error", error: error.message });
      } else {
        console.log(`Created draft booking for ${parsed.date}`);
        results.push({ subject, status: "created", booking_id: booking.id });

        // Create notification for admins
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (admins) {
          for (const admin of admins) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              type: "booking_request",
              title: "New Booking Request",
              message: `${parsed.client_name || "Unknown"} requested a studio booking for ${parsed.date}`,
              data: { booking_id: booking.id },
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing emails:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
