import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SourceReference {
  type: "project" | "task" | "client" | "booking";
  id: string;
  title: string;
  url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ answer: null, isQuestion: false, sources: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // First, determine if this is a question that needs AI answering
    const isQuestion = /^(who|what|when|where|why|how|which|can|could|should|is|are|was|were|do|does|did|has|have|had|will|would|list|show|find|get)/i.test(query.trim());

    if (!isQuestion) {
      return new Response(
        JSON.stringify({ answer: null, isQuestion: false, sources: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch relevant context from the database
    const [projectsResult, clientsResult, tasksResult, bookingsResult] = await Promise.all([
      supabase
        .from("projects")
        .select(`
          id, title, status, description, due_date, created_at,
          client:clients(id, name, company),
          tasks:tasks(id, title, status, assigned_to)
        `)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("clients")
        .select("id, name, company, email, services_needed, client_type")
        .limit(50),
      supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, assigned_to, hours_logged,
          project:projects(id, title)
        `)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("studio_bookings")
        .select(`
          id, event_name, booking_type, date, status,
          client:clients(id, name)
        `)
        .order("date", { ascending: false })
        .limit(20),
    ]);

    // Build context for AI with IDs for source tracking
    const projectContext = projectsResult.data?.map(p => {
      const client = Array.isArray(p.client) ? p.client[0] : p.client;
      const taskCount = Array.isArray(p.tasks) ? p.tasks.length : 0;
      return `[PROJECT_ID:${p.id}] Project: "${p.title}" | Client: ${client?.name || "Unknown"} (ID:${client?.id || "N/A"}) | Status: ${p.status} | Tasks: ${taskCount} | Due: ${p.due_date || "No deadline"}`;
    }).join("\n") || "";

    const clientContext = clientsResult.data?.map(c => 
      `[CLIENT_ID:${c.id}] Client: "${c.name}" | Company: ${c.company || "N/A"} | Type: ${c.client_type?.join(", ") || "Unknown"} | Services: ${c.services_needed?.join(", ") || "None listed"}`
    ).join("\n") || "";

    const taskContext = tasksResult.data?.map(t => {
      const project = Array.isArray(t.project) ? t.project[0] : t.project;
      return `[TASK_ID:${t.id}] Task: "${t.title}" | Project: ${project?.title || "Unknown"} (PROJECT_ID:${project?.id || "N/A"}) | Status: ${t.status} | Priority: ${t.priority} | Hours: ${t.hours_logged || 0}`;
    }).join("\n") || "";

    const bookingContext = bookingsResult.data?.map(b => {
      const client = Array.isArray(b.client) ? b.client[0] : b.client;
      return `[BOOKING_ID:${b.id}] Booking: "${b.event_name || b.booking_type}" | Client: ${client?.name || "Unknown"} (CLIENT_ID:${client?.id || "N/A"}) | Date: ${b.date} | Status: ${b.status}`;
    }).join("\n") || "";

    const systemPrompt = `You are an intelligent assistant for a creative agency's project management system. You have access to the following data:

**PROJECTS:**
${projectContext || "No projects found."}

**CLIENTS:**
${clientContext || "No clients found."}

**TASKS:**
${taskContext || "No tasks found."}

**STUDIO BOOKINGS:**
${bookingContext || "No bookings found."}

Answer questions about this data concisely and accurately. If you don't have enough information to answer, say so. Keep responses under 3 sentences unless more detail is explicitly needed.

IMPORTANT: 
1. Only provide factual answers based on the data above. Do not make assumptions or provide information not present in the data.
2. At the end of your response, ALWAYS include a "SOURCES:" section listing the IDs of the records you referenced in your answer, in this exact format:
   SOURCES: PROJECT_ID:uuid1, CLIENT_ID:uuid2, TASK_ID:uuid3, BOOKING_ID:uuid4
   Only include IDs that were directly relevant to answering the question.`;

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
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let answer = aiResponse.choices?.[0]?.message?.content || "";

    // Parse sources from AI response
    const sources: SourceReference[] = [];
    const sourcesMatch = answer.match(/SOURCES:\s*(.+?)(?:$|\n)/i);
    
    if (sourcesMatch) {
      const sourcesList = sourcesMatch[1];
      // Remove sources line from displayed answer
      answer = answer.replace(/\n?SOURCES:.*$/i, "").trim();
      
      // Parse PROJECT_ID, CLIENT_ID, TASK_ID, BOOKING_ID references
      const projectIds = sourcesList.match(/PROJECT_ID:([a-f0-9-]+)/gi) || [];
      const clientIds = sourcesList.match(/CLIENT_ID:([a-f0-9-]+)/gi) || [];
      const taskIds = sourcesList.match(/TASK_ID:([a-f0-9-]+)/gi) || [];
      const bookingIds = sourcesList.match(/BOOKING_ID:([a-f0-9-]+)/gi) || [];

      // Add projects
      for (const match of projectIds) {
        const id = match.replace("PROJECT_ID:", "");
        const project = projectsResult.data?.find(p => p.id === id);
        if (project) {
          sources.push({
            type: "project",
            id,
            title: project.title,
            url: `/projects?id=${id}`,
          });
        }
      }

      // Add clients
      for (const match of clientIds) {
        const id = match.replace("CLIENT_ID:", "");
        const client = clientsResult.data?.find(c => c.id === id);
        if (client) {
          sources.push({
            type: "client",
            id,
            title: client.name,
            url: `/vault?tab=clients&id=${id}`,
          });
        }
      }

      // Add tasks
      for (const match of taskIds) {
        const id = match.replace("TASK_ID:", "");
        const task = tasksResult.data?.find(t => t.id === id);
        if (task) {
          sources.push({
            type: "task",
            id,
            title: task.title,
            url: `/projects?task=${id}`,
          });
        }
      }

      // Add bookings
      for (const match of bookingIds) {
        const id = match.replace("BOOKING_ID:", "");
        const booking = bookingsResult.data?.find(b => b.id === id);
        if (booking) {
          sources.push({
            type: "booking",
            id,
            title: booking.event_name || booking.booking_type,
            url: `/studio?booking=${id}`,
          });
        }
      }
    }

    console.log("AI search answered query:", query.substring(0, 50), "with", sources.length, "sources");

    return new Response(
      JSON.stringify({ answer, isQuestion: true, sources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
