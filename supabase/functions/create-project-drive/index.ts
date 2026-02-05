 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 async function createDriveFolder(
   accessToken: string,
   name: string,
   parentId?: string
 ): Promise<{ id: string; name: string } | null> {
   try {
     const metadata: Record<string, unknown> = {
       name,
       mimeType: "application/vnd.google-apps.folder",
     };
     
     if (parentId) {
       metadata.parents = [parentId];
     }
 
     const response = await fetch("https://www.googleapis.com/drive/v3/files", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${accessToken}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify(metadata),
     });
 
     if (!response.ok) {
       console.error("Failed to create folder:", await response.text());
       return null;
     }
 
     return await response.json();
   } catch (error) {
     console.error("Error creating folder:", error);
     return null;
   }
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const { project_id, client_name, user_id } = await req.json();
     
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     // Get user's Google OAuth token
     const { data: tokenData, error: tokenError } = await supabase
       .from("google_oauth_tokens")
       .select("access_token")
       .eq("user_id", user_id)
       .single();
 
     if (tokenError || !tokenData?.access_token) {
       console.error("No OAuth token found:", tokenError);
       return new Response(
         JSON.stringify({ error: "Google OAuth not connected", skipped: true }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const accessToken = tokenData.access_token;
     
     // Create folder with naming convention: [ClientName]_Assets
     const safeClientName = client_name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
     const folderName = `${safeClientName}_Assets`;
     
     console.log(`Creating project folder: ${folderName}`);
     
     const folder = await createDriveFolder(accessToken, folderName);
     
     if (!folder) {
       throw new Error("Failed to create project folder");
     }
 
     // Update the client record with the folder ID
     const { data: project } = await supabase
       .from("projects")
       .select("client_id")
       .eq("id", project_id)
       .single();
 
     if (project?.client_id) {
       await supabase
         .from("clients")
         .update({ brand_assets_folder: folder.id })
         .eq("id", project.client_id);
     }
 
     console.log("Created project folder:", folder);
 
     return new Response(
       JSON.stringify({
         success: true,
         folder_id: folder.id,
         folder_name: folderName,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Create project drive error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });