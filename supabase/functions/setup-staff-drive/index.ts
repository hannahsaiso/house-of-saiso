 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface DriveFolder {
   id: string;
   name: string;
 }
 
 async function createDriveFolder(
   accessToken: string,
   name: string,
   parentId?: string
 ): Promise<DriveFolder | null> {
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
 
 async function findOrCreateFolder(
   accessToken: string,
   name: string,
   parentId?: string
 ): Promise<string | null> {
   // First, try to find existing folder
   const query = parentId
     ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
     : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
 
   try {
     const searchResponse = await fetch(
       `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
       {
         headers: { Authorization: `Bearer ${accessToken}` },
       }
     );
 
     if (searchResponse.ok) {
       const searchData = await searchResponse.json();
       if (searchData.files && searchData.files.length > 0) {
         return searchData.files[0].id;
       }
     }
   } catch (error) {
     console.error("Error searching for folder:", error);
   }
 
   // Create if not found
   const newFolder = await createDriveFolder(accessToken, name, parentId);
   return newFolder?.id || null;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const { user_id, staff_name } = await req.json();
     
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
         JSON.stringify({ error: "Google OAuth not connected" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const accessToken = tokenData.access_token;
     const safeName = staff_name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
 
     // Create folder hierarchy: Internal > Staff > [StaffName]
     console.log(`Creating folder hierarchy for ${safeName}...`);
     
     const internalFolderId = await findOrCreateFolder(accessToken, "Internal");
     if (!internalFolderId) {
       throw new Error("Failed to create Internal folder");
     }
 
     const staffFolderId = await findOrCreateFolder(accessToken, "Staff", internalFolderId);
     if (!staffFolderId) {
       throw new Error("Failed to create Staff folder");
     }
 
     const userFolderId = await findOrCreateFolder(accessToken, safeName, staffFolderId);
     if (!userFolderId) {
       throw new Error("Failed to create user folder");
     }
 
     // Create subfolders
     const subfolders = ["Drafts", "Projects", "Resources"];
     const createdFolders: Record<string, string> = { root: userFolderId };
 
     for (const subfolder of subfolders) {
       const subId = await findOrCreateFolder(accessToken, subfolder, userFolderId);
       if (subId) {
         createdFolders[subfolder.toLowerCase()] = subId;
       }
     }
 
     console.log("Created folder structure:", createdFolders);
 
     return new Response(
       JSON.stringify({
         success: true,
         folders: createdFolders,
         message: `Created folder structure for ${safeName}`,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Setup staff drive error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });