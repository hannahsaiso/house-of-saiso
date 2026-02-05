 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 interface IntakeToken {
   id: string;
   project_id: string;
   client_id: string | null;
   token: string;
   expires_at: string | null;
   is_active: boolean;
   created_at: string;
   completed_at: string | null;
   uploaded_files_count: number;
   visual_anchors: string[];
 }
 
 export function useIntakeToken(projectId: string) {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: intakeToken, isLoading } = useQuery({
     queryKey: ["intake-token", projectId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("client_intake_tokens")
         .select("*")
         .eq("project_id", projectId)
         .maybeSingle();
 
       if (error) throw error;
       return data as IntakeToken | null;
     },
     enabled: !!projectId,
   });
 
   const createToken = useMutation({
     mutationFn: async (clientId?: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const { data, error } = await supabase
         .from("client_intake_tokens")
         .insert({
           project_id: projectId,
           client_id: clientId || null,
           created_by: user.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return data as IntakeToken;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["intake-token", projectId] });
       toast({
         title: "Intake link created",
         description: "You can now share the link with your client.",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Failed to create link",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 
   const regenerateToken = useMutation({
     mutationFn: async () => {
       if (!intakeToken) throw new Error("No token exists");
 
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       // Delete old token
       await supabase
         .from("client_intake_tokens")
         .delete()
         .eq("id", intakeToken.id);
 
       // Create new token
       const { data, error } = await supabase
         .from("client_intake_tokens")
         .insert({
           project_id: projectId,
           client_id: intakeToken.client_id,
           created_by: user.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return data as IntakeToken;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["intake-token", projectId] });
       toast({
         title: "Link regenerated",
         description: "The old link is now invalid.",
       });
     },
   });
 
   const getIntakeUrl = () => {
     if (!intakeToken) return null;
     const baseUrl = window.location.origin;
     return `${baseUrl}/intake/${projectId}?token=${intakeToken.token}`;
   };
 
   return {
     intakeToken,
     isLoading,
     createToken,
     regenerateToken,
     getIntakeUrl,
     isCompleted: !!intakeToken?.completed_at,
     uploadedCount: intakeToken?.uploaded_files_count || 0,
   };
 }