 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import type { Json } from "@/integrations/supabase/types";
 
 export interface InspirationItem {
   id: string;
   type: "image" | "link";
   url: string;
   title?: string;
   thumbnail?: string;
 }
 
 export interface IntakeCanvas {
   id: string;
   project_id: string;
   project_goals: string | null;
   brand_pillars: string[] | null;
   tone_of_voice: string | null;
   competitors: string | null;
   target_audience: string | null;
   inspiration_gallery: InspirationItem[];
   kickoff_template_enabled: boolean;
   created_by: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface KnowledgeVault {
   id: string;
   project_id: string;
   canvas_id: string | null;
   project_charter: string;
   tone_tags: string[] | null;
   pillar_tags: string[] | null;
   is_locked: boolean;
   generated_at: string;
   generated_by: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface IntakeCanvasInput {
   project_goals?: string;
   brand_pillars?: string[];
   tone_of_voice?: string;
   competitors?: string;
   target_audience?: string;
   inspiration_gallery?: InspirationItem[];
   kickoff_template_enabled?: boolean;
 }
 
 export function useIntakeCanvas(projectId: string) {
   const queryClient = useQueryClient();
 
   const { data: canvas, isLoading: isLoadingCanvas } = useQuery({
     queryKey: ["intake-canvas", projectId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("project_intake_canvas")
         .select("*")
         .eq("project_id", projectId)
         .maybeSingle();
 
       if (error) throw error;
       if (!data) return null;
       
       return {
         id: data.id,
         project_id: data.project_id,
         project_goals: data.project_goals,
         brand_pillars: data.brand_pillars,
         tone_of_voice: data.tone_of_voice,
         competitors: data.competitors,
         target_audience: data.target_audience,
         inspiration_gallery: (data.inspiration_gallery as unknown as InspirationItem[]) || [],
         kickoff_template_enabled: data.kickoff_template_enabled ?? false,
         created_by: data.created_by,
         created_at: data.created_at,
         updated_at: data.updated_at,
       } as IntakeCanvas;
     },
     enabled: !!projectId,
   });
 
   const { data: vault, isLoading: isLoadingVault } = useQuery({
     queryKey: ["knowledge-vault", projectId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("project_knowledge_vault")
         .select("*")
         .eq("project_id", projectId)
         .maybeSingle();
 
       if (error) throw error;
       if (!data) return null;
       
       return {
         id: data.id,
         project_id: data.project_id,
         canvas_id: data.canvas_id,
         project_charter: data.project_charter,
         tone_tags: data.tone_tags,
         pillar_tags: data.pillar_tags,
         is_locked: data.is_locked ?? true,
         generated_at: data.generated_at,
         generated_by: data.generated_by,
         created_at: data.created_at,
         updated_at: data.updated_at,
       } as KnowledgeVault;
     },
     enabled: !!projectId,
   });
 
   const saveCanvas = useMutation({
     mutationFn: async (input: IntakeCanvasInput) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const galleryJson = (input.inspiration_gallery || []) as unknown as Json;
 
       if (canvas) {
         const { data, error } = await supabase
           .from("project_intake_canvas")
           .update({
             project_goals: input.project_goals,
             brand_pillars: input.brand_pillars,
             tone_of_voice: input.tone_of_voice,
             competitors: input.competitors,
             target_audience: input.target_audience,
             kickoff_template_enabled: input.kickoff_template_enabled,
             inspiration_gallery: galleryJson,
           })
           .eq("id", canvas.id)
           .select()
           .single();
 
         if (error) throw error;
         return data;
       } else {
         const { data, error } = await supabase
           .from("project_intake_canvas")
           .insert([{
             project_id: projectId,
             project_goals: input.project_goals,
             brand_pillars: input.brand_pillars,
             tone_of_voice: input.tone_of_voice,
             competitors: input.competitors,
             target_audience: input.target_audience,
             kickoff_template_enabled: input.kickoff_template_enabled,
             inspiration_gallery: galleryJson,
             created_by: user.id,
           }])
           .select()
           .single();
 
         if (error) throw error;
         return data;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["intake-canvas", projectId] });
       toast.success("Intake Canvas saved");
     },
     onError: (error) => {
       toast.error("Failed to save: " + error.message);
     },
   });
 
   const generateCharter = useMutation({
     mutationFn: async (canvasId: string) => {
       const { data, error } = await supabase.functions.invoke("generate-project-charter", {
         body: { canvas_id: canvasId, project_id: projectId },
       });
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["knowledge-vault", projectId] });
       toast.success("Project Charter generated successfully");
     },
     onError: (error) => {
       toast.error("Failed to generate charter: " + error.message);
     },
   });
 
   const triggerKickoffTasks = useMutation({
     mutationFn: async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const { data: frankie } = await supabase
         .from("staff_profiles")
         .select("user_id")
         .ilike("full_name", "%frankie%")
         .maybeSingle();
 
       const kickoffTasks = [
         { title: "Audit Client Assets", description: "Review all incoming assets from client" },
         { title: "Strategy Review", description: "Review project strategy and goals from Intake Canvas" },
         { title: "Creative Direction Setup", description: "Establish creative direction based on brand pillars and tone" },
       ];
 
       const today = new Date();
       const thisWeekEnd = new Date(today);
       thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));
 
       for (const task of kickoffTasks) {
         await supabase.from("tasks").insert({
           project_id: projectId,
           title: task.title,
           description: task.description,
           priority: "high",
           status: "todo",
           assigned_to: frankie?.user_id || null,
           due_date: thisWeekEnd.toISOString().split("T")[0],
           created_by: user.id,
         });
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["project-tasks-temporal", projectId] });
       toast.success("Kickoff tasks created for This Week");
     },
     onError: (error) => {
       toast.error("Failed to create kickoff tasks: " + error.message);
     },
   });
 
   return {
     canvas,
     vault,
     isLoadingCanvas,
     isLoadingVault,
     saveCanvas,
     generateCharter,
     triggerKickoffTasks,
   };
 }