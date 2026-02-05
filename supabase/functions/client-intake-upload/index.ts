 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface IntakeRequest {
   token: string;
   action: "validate" | "upload" | "complete";
   file_name?: string;
   file_data?: string; // base64
   file_type?: string;
   visual_anchors?: string[];
 }
 
 async function uploadFileToDrive(
   accessToken: string,
   folderId: string,
   fileName: string,
   fileData: Uint8Array,
   mimeType: string
 ): Promise<{ id: string; name: string } | null> {
   try {
     const metadata = {
       name: fileName,
       parents: [folderId],
     };
 
     const boundary = "intake_upload_boundary";
     const delimiter = `\r\n--${boundary}\r\n`;
     const closeDelimiter = `\r\n--${boundary}--`;
 
     const metadataPart = 
       delimiter +
       "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
       JSON.stringify(metadata);
 
     const filePart = 
       delimiter +
       `Content-Type: ${mimeType}\r\n` +
       "Content-Transfer-Encoding: base64\r\n\r\n";
 
     // Convert file data to base64
     const base64Data = btoa(String.fromCharCode(...fileData));
 
     const multipartBody = metadataPart + filePart + base64Data + closeDelimiter;
 
     const response = await fetch(
       "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
       {
         method: "POST",
         headers: {
           Authorization: `Bearer ${accessToken}`,
           "Content-Type": `multipart/related; boundary=${boundary}`,
         },
         body: multipartBody,
       }
     );
 
     if (!response.ok) {
       console.error("Failed to upload file:", await response.text());
       return null;
     }
 
     return await response.json();
   } catch (error) {
     console.error("Error uploading file:", error);
     return null;
   }
 }
 
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
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const body: IntakeRequest = await req.json();
     const { token, action } = body;
 
     // Validate token
     const { data: intakeToken, error: tokenError } = await supabase
       .from("client_intake_tokens")
       .select(`
         *,
         projects!inner(id, title, client_id, intake_folder_id, created_by, clients(name, company))
       `)
       .eq("token", token)
       .eq("is_active", true)
       .single();
 
     if (tokenError || !intakeToken) {
       console.error("Invalid token:", tokenError);
       return new Response(
         JSON.stringify({ error: "Invalid or expired access link" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check expiration
     if (intakeToken.expires_at && new Date(intakeToken.expires_at) < new Date()) {
       return new Response(
         JSON.stringify({ error: "This access link has expired" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const project = intakeToken.projects;
     const clientName = project.clients?.company || project.clients?.name || "Client";
 
     // Handle validation request
     if (action === "validate") {
       return new Response(
         JSON.stringify({
           valid: true,
           project_title: project.title,
           client_name: clientName,
           uploaded_files_count: intakeToken.uploaded_files_count || 0,
           visual_anchors: intakeToken.visual_anchors || [],
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Get admin's Google OAuth token
     const { data: tokenData, error: oauthError } = await supabase
       .from("google_oauth_tokens")
       .select("access_token")
       .eq("user_id", project.created_by)
       .single();
 
     if (oauthError || !tokenData?.access_token) {
       console.error("No OAuth token for project creator:", oauthError);
       return new Response(
         JSON.stringify({ error: "File upload not configured. Please contact support." }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const accessToken = tokenData.access_token;
 
     // Ensure intake folder exists
     let folderId = project.intake_folder_id;
     
     if (!folderId) {
       // Create the intake folder structure
       const safeClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
       const intakeFolder = await createDriveFolder(
         accessToken, 
         `${safeClientName} / 00_INTAKE_&_ASSETS`
       );
       
       if (intakeFolder) {
         folderId = intakeFolder.id;
         await supabase
           .from("projects")
           .update({ intake_folder_id: folderId })
           .eq("id", project.id);
       } else {
         return new Response(
           JSON.stringify({ error: "Failed to create upload folder" }),
           { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
     }
 
     // Handle file upload
     if (action === "upload") {
       const { file_name, file_data, file_type } = body;
       
       if (!file_name || !file_data || !file_type) {
         return new Response(
           JSON.stringify({ error: "Missing file data" }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Decode base64 file data
       const binaryString = atob(file_data);
       const bytes = new Uint8Array(binaryString.length);
       for (let i = 0; i < binaryString.length; i++) {
         bytes[i] = binaryString.charCodeAt(i);
       }
 
       const uploadedFile = await uploadFileToDrive(
         accessToken,
         folderId,
         file_name,
         bytes,
         file_type
       );
 
       if (!uploadedFile) {
         return new Response(
           JSON.stringify({ error: "Failed to upload file" }),
           { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Update file count
       const newCount = (intakeToken.uploaded_files_count || 0) + 1;
       await supabase
         .from("client_intake_tokens")
         .update({ uploaded_files_count: newCount })
         .eq("id", intakeToken.id);
 
       console.log(`File uploaded: ${file_name} to folder ${folderId}`);
 
       return new Response(
         JSON.stringify({
           success: true,
           file_id: uploadedFile.id,
           file_name: uploadedFile.name,
           uploaded_count: newCount,
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Handle completion
     if (action === "complete") {
       const { visual_anchors } = body;
 
       // Update token as completed and deactivate
       await supabase
         .from("client_intake_tokens")
         .update({
           is_active: false,
           completed_at: new Date().toISOString(),
           visual_anchors: visual_anchors || [],
         })
         .eq("id", intakeToken.id);
 
       // Update project onboarding status
       await supabase
         .from("projects")
         .update({ onboarding_status: "completed" })
         .eq("id", project.id);
 
       // Update knowledge vault with visual anchors if they exist
       if (visual_anchors && visual_anchors.length > 0) {
         const { data: vault } = await supabase
           .from("project_knowledge_vault")
           .select("id")
           .eq("project_id", project.id)
           .single();
 
         if (vault) {
           // Add visual anchors as primary references
           const existingCharter = await supabase
             .from("project_knowledge_vault")
             .select("project_charter")
             .eq("id", vault.id)
             .single();
 
           const anchorsSection = `\n\n## Visual Anchors & References\n\n${visual_anchors.map((url: string) => `- [Reference](${url})`).join("\n")}`;
           
           await supabase
             .from("project_knowledge_vault")
             .update({
               project_charter: (existingCharter.data?.project_charter || "") + anchorsSection,
             })
             .eq("id", vault.id);
         }
       }
 
       // Create notification for admin/staff
       const { data: adminStaff } = await supabase
         .from("user_roles")
         .select("user_id")
         .in("role", ["admin", "staff"]);
 
       if (adminStaff && adminStaff.length > 0) {
         const fileCount = intakeToken.uploaded_files_count || 0;
         const notifications = adminStaff.map((role: { user_id: string }) => ({
           user_id: role.user_id,
           type: "intake_complete",
           title: "Onboarding Complete",
           message: `${clientName} has uploaded ${fileCount} asset${fileCount !== 1 ? "s" : ""}.`,
           data: { 
             project_id: project.id, 
             client_name: clientName,
             files_count: fileCount,
             navigate_to: "knowledge_vault"
           },
         }));
 
         await supabase.from("notifications").insert(notifications);
       }
 
       console.log(`Intake completed for project ${project.id}`);
 
       return new Response(
         JSON.stringify({
           success: true,
           message: "Onboarding completed successfully",
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     return new Response(
       JSON.stringify({ error: "Invalid action" }),
       { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Client intake error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });