 import { useState, useEffect } from "react";
 import { motion } from "framer-motion";
 import { 
   Save, 
   Sparkles, 
   Plus, 
   X, 
   Link as LinkIcon, 
   Image as ImageIcon,
   ExternalLink,
   Loader2,
   CheckCircle,
   PlayCircle,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent } from "@/components/ui/card";
 import { Separator } from "@/components/ui/separator";
 import { 
   useIntakeCanvas, 
   type IntakeCanvasInput, 
   type InspirationItem 
 } from "@/hooks/useIntakeCanvas";
 import { useUserRole } from "@/hooks/useUserRole";
 
 interface IntakeCanvasTabProps {
   projectId: string;
 }
 
 export function IntakeCanvasTab({ projectId }: IntakeCanvasTabProps) {
   const { canvas, vault, isLoadingCanvas, saveCanvas, generateCharter, triggerKickoffTasks } = useIntakeCanvas(projectId);
   const { isAdminOrStaff } = useUserRole();
   
   const [formData, setFormData] = useState<IntakeCanvasInput>({
     project_goals: "",
     brand_pillars: [],
     tone_of_voice: "",
     competitors: "",
     target_audience: "",
     inspiration_gallery: [],
     kickoff_template_enabled: false,
   });
   
   const [newPillar, setNewPillar] = useState("");
   const [newInspirationUrl, setNewInspirationUrl] = useState("");
   const [isDirty, setIsDirty] = useState(false);
 
   useEffect(() => {
     if (canvas) {
       setFormData({
         project_goals: canvas.project_goals || "",
         brand_pillars: canvas.brand_pillars || [],
         tone_of_voice: canvas.tone_of_voice || "",
         competitors: canvas.competitors || "",
         target_audience: canvas.target_audience || "",
         inspiration_gallery: canvas.inspiration_gallery || [],
         kickoff_template_enabled: canvas.kickoff_template_enabled || false,
       });
     }
   }, [canvas]);
 
   const handleChange = (field: keyof IntakeCanvasInput, value: unknown) => {
     setFormData((prev) => ({ ...prev, [field]: value }));
     setIsDirty(true);
   };
 
   const handleAddPillar = () => {
     if (newPillar.trim()) {
       handleChange("brand_pillars", [...(formData.brand_pillars || []), newPillar.trim()]);
       setNewPillar("");
     }
   };
 
   const handleRemovePillar = (index: number) => {
     const updated = [...(formData.brand_pillars || [])];
     updated.splice(index, 1);
     handleChange("brand_pillars", updated);
   };
 
   const handleAddInspiration = () => {
     if (newInspirationUrl.trim()) {
       const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(newInspirationUrl);
       const newItem: InspirationItem = {
         id: crypto.randomUUID(),
         type: isImage ? "image" : "link",
         url: newInspirationUrl.trim(),
         title: isImage ? "Visual Reference" : new URL(newInspirationUrl).hostname,
       };
       handleChange("inspiration_gallery", [...(formData.inspiration_gallery || []), newItem]);
       setNewInspirationUrl("");
     }
   };
 
   const handleRemoveInspiration = (id: string) => {
     handleChange(
       "inspiration_gallery",
       (formData.inspiration_gallery || []).filter((item) => item.id !== id)
     );
   };
 
   const handleSave = async () => {
     await saveCanvas.mutateAsync(formData);
     setIsDirty(false);
   };
 
   const handleGenerateCharter = async () => {
     if (!canvas?.id) {
       await saveCanvas.mutateAsync(formData);
     }
     const canvasId = canvas?.id;
     if (canvasId) {
       await generateCharter.mutateAsync(canvasId);
     }
   };
 
   const handleTriggerKickoff = async () => {
     await triggerKickoffTasks.mutateAsync();
   };
 
   if (isLoadingCanvas) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (!isAdminOrStaff) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <p className="text-muted-foreground">
           The Intake Canvas is for internal use only.
         </p>
       </div>
     );
   }
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="mx-auto max-w-4xl space-y-8"
     >
       {/* Editorial Header */}
       <div className="border-b border-border pb-6">
         <p className="text-xs font-medium uppercase tracking-editorial text-muted-foreground">
           Internal Brief
         </p>
         <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
           Intake Canvas
         </h2>
         <p className="mt-2 max-w-xl text-muted-foreground">
           Document the strategic foundation for this project. This information will be synthesized into the Knowledge Vault.
         </p>
       </div>
 
       {/* Form Grid */}
       <div className="grid gap-10 md:grid-cols-2">
         {/* Left Column */}
         <div className="space-y-8">
           {/* Project Goals */}
           <div className="space-y-3">
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Project Goals
             </Label>
             <Textarea
               value={formData.project_goals}
               onChange={(e) => handleChange("project_goals", e.target.value)}
               placeholder="What does success look like for this project? What are the key deliverables and outcomes?"
               className="min-h-[120px] resize-none border-border/50 bg-background font-sans text-base leading-relaxed placeholder:text-muted-foreground/50"
             />
           </div>
 
           {/* Brand Pillars */}
           <div className="space-y-3">
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Brand Pillars
             </Label>
             <div className="flex flex-wrap gap-2">
               {(formData.brand_pillars || []).map((pillar, index) => (
                 <Badge
                   key={index}
                   variant="secondary"
                   className="gap-1 py-1.5 pl-3 pr-2 text-sm"
                 >
                   {pillar}
                   <button
                     onClick={() => handleRemovePillar(index)}
                     className="ml-1 rounded-full hover:bg-foreground/10"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </Badge>
               ))}
             </div>
             <div className="flex gap-2">
               <Input
                 value={newPillar}
                 onChange={(e) => setNewPillar(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPillar())}
                 placeholder="Add a brand pillar..."
                 className="border-border/50"
               />
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleAddPillar}
                 disabled={!newPillar.trim()}
               >
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
           </div>
 
           {/* Tone of Voice */}
           <div className="space-y-3">
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Tone of Voice
             </Label>
             <Textarea
               value={formData.tone_of_voice}
               onChange={(e) => handleChange("tone_of_voice", e.target.value)}
               placeholder="How should the brand sound? Describe the personality, communication style, and emotional register..."
               className="min-h-[100px] resize-none border-border/50 bg-background font-sans text-base leading-relaxed placeholder:text-muted-foreground/50"
             />
           </div>
         </div>
 
         {/* Right Column */}
         <div className="space-y-8">
           {/* Target Audience */}
           <div className="space-y-3">
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Target Audience
             </Label>
             <Textarea
               value={formData.target_audience}
               onChange={(e) => handleChange("target_audience", e.target.value)}
               placeholder="Who are we speaking to? Demographics, psychographics, behaviors, pain points..."
               className="min-h-[120px] resize-none border-border/50 bg-background font-sans text-base leading-relaxed placeholder:text-muted-foreground/50"
             />
           </div>
 
           {/* Competitors */}
           <div className="space-y-3">
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Competitors & Market Context
             </Label>
             <Textarea
               value={formData.competitors}
               onChange={(e) => handleChange("competitors", e.target.value)}
               placeholder="Who are the key competitors? What's the market landscape? What differentiates this brand?"
               className="min-h-[100px] resize-none border-border/50 bg-background font-sans text-base leading-relaxed placeholder:text-muted-foreground/50"
             />
           </div>
 
           {/* Kickoff Template Toggle */}
           <Card className="border-dashed">
             <CardContent className="flex items-center justify-between p-4">
               <div>
                 <p className="font-medium">Kickoff Template</p>
                 <p className="text-sm text-muted-foreground">
                   Auto-generate 3 starter tasks in This Week
                 </p>
               </div>
               <Switch
                 checked={formData.kickoff_template_enabled}
                 onCheckedChange={(checked) => handleChange("kickoff_template_enabled", checked)}
               />
             </CardContent>
           </Card>
         </div>
       </div>
 
       <Separator />
 
       {/* Inspiration Gallery */}
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <div>
             <Label className="font-heading text-sm font-semibold uppercase tracking-wide">
               Inspiration Gallery
             </Label>
             <p className="mt-1 text-sm text-muted-foreground">
               Add visual references and inspiration links
             </p>
           </div>
         </div>
 
         <div className="flex gap-2">
           <Input
             value={newInspirationUrl}
             onChange={(e) => setNewInspirationUrl(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInspiration())}
             placeholder="Paste image URL or website link..."
             className="border-border/50"
           />
           <Button
             variant="outline"
             onClick={handleAddInspiration}
             disabled={!newInspirationUrl.trim()}
           >
             <Plus className="mr-2 h-4 w-4" />
             Add
           </Button>
         </div>
 
         {(formData.inspiration_gallery || []).length > 0 && (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {(formData.inspiration_gallery || []).map((item) => (
               <Card key={item.id} className="group relative overflow-hidden">
                 <CardContent className="p-0">
                   {item.type === "image" ? (
                     <div className="aspect-video bg-muted">
                       <img
                         src={item.url}
                         alt={item.title}
                         className="h-full w-full object-cover"
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = "/placeholder.svg";
                         }}
                       />
                     </div>
                   ) : (
                     <div className="flex aspect-video items-center justify-center bg-muted/50">
                       <div className="text-center">
                         <LinkIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                         <p className="mt-2 text-xs text-muted-foreground">
                           {item.title}
                         </p>
                       </div>
                     </div>
                   )}
                   <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                     <Button
                       size="sm"
                       variant="secondary"
                       onClick={() => window.open(item.url, "_blank")}
                     >
                       <ExternalLink className="h-4 w-4" />
                     </Button>
                     <Button
                       size="sm"
                       variant="destructive"
                       onClick={() => handleRemoveInspiration(item.id)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
 
         {(formData.inspiration_gallery || []).length === 0 && (
           <Card className="border-dashed">
             <CardContent className="flex flex-col items-center justify-center py-8 text-center">
               <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
               <p className="mt-2 text-sm text-muted-foreground">
                 No inspiration added yet
               </p>
             </CardContent>
           </Card>
         )}
       </div>
 
       <Separator />
 
       {/* Action Bar */}
       <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/30 p-4">
         <div className="flex items-center gap-4">
           <Button
             onClick={handleSave}
             disabled={saveCanvas.isPending || !isDirty}
             className="gap-2"
           >
             {saveCanvas.isPending ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <Save className="h-4 w-4" />
             )}
             Save Canvas
           </Button>
 
           {canvas && !vault && (
             <Button
               variant="secondary"
               onClick={handleGenerateCharter}
               disabled={generateCharter.isPending}
               className="gap-2"
             >
               {generateCharter.isPending ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <Sparkles className="h-4 w-4" />
               )}
               Generate Project Charter
             </Button>
           )}
 
           {vault && (
              <Badge variant="outline" className="gap-1.5 py-1.5 text-primary">
               <CheckCircle className="h-3.5 w-3.5" />
               Charter Generated
             </Badge>
           )}
         </div>
 
         {formData.kickoff_template_enabled && canvas && (
           <Button
             variant="outline"
             onClick={handleTriggerKickoff}
             disabled={triggerKickoffTasks.isPending}
             className="gap-2"
           >
             {triggerKickoffTasks.isPending ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <PlayCircle className="h-4 w-4" />
             )}
             Launch Kickoff Tasks
           </Button>
         )}
       </div>
     </motion.div>
   );
 }