 import { useState, useEffect, useCallback } from "react";
 import { useParams, useSearchParams } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileImage, FileText, Loader2, Check, Plus, Link as LinkIcon, Sparkles, Clock, CheckCircle2, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 
 interface UploadedFile {
   id: string;
   name: string;
   type: string;
   uploading?: boolean;
   uploaded?: boolean;
 }
 
 export default function ClientIntake() {
   const { projectId } = useParams();
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token");
   const { toast } = useToast();
 
   const [isValidating, setIsValidating] = useState(true);
   const [isValid, setIsValid] = useState(false);
   const [projectTitle, setProjectTitle] = useState("");
   const [clientName, setClientName] = useState("");
   const [error, setError] = useState<string | null>(null);
 
   const [files, setFiles] = useState<UploadedFile[]>([]);
   const [visualAnchors, setVisualAnchors] = useState<string[]>([""]);
   const [isDragging, setIsDragging] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showSuccess, setShowSuccess] = useState(false);
   const [uploadedCount, setUploadedCount] = useState(0);
  const [submittedClientName, setSubmittedClientName] = useState("");
 
   // Validate token on mount
   useEffect(() => {
     async function validateToken() {
       if (!token) {
         setError("Missing access token");
         setIsValidating(false);
         return;
       }
 
       try {
         const { data, error } = await supabase.functions.invoke("client-intake-upload", {
           body: { token, action: "validate" },
         });
 
         if (error || data?.error) {
           setError(data?.error || "Invalid access link");
           setIsValid(false);
         } else {
           setIsValid(true);
           setProjectTitle(data.project_title);
           setClientName(data.client_name);
           setUploadedCount(data.uploaded_files_count || 0);
           if (data.visual_anchors?.length > 0) {
             setVisualAnchors(data.visual_anchors);
           }
         }
       } catch (err) {
         console.error("Validation error:", err);
         setError("Failed to validate access link");
       } finally {
         setIsValidating(false);
       }
     }
 
     validateToken();
   }, [token]);
 
   const handleDragOver = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(true);
   }, []);
 
   const handleDragLeave = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(false);
   }, []);
 
   const uploadFile = async (file: File): Promise<boolean> => {
     try {
       const reader = new FileReader();
       
       return new Promise((resolve) => {
         reader.onload = async () => {
           const base64 = (reader.result as string).split(",")[1];
           
           const { data, error } = await supabase.functions.invoke("client-intake-upload", {
             body: {
               token,
               action: "upload",
               file_name: file.name,
               file_data: base64,
               file_type: file.type,
             },
           });
 
           if (error || data?.error) {
             console.error("Upload error:", data?.error || error);
             resolve(false);
           } else {
             setUploadedCount(data.uploaded_count);
             resolve(true);
           }
         };
 
         reader.onerror = () => resolve(false);
         reader.readAsDataURL(file);
       });
     } catch (err) {
       console.error("Upload error:", err);
       return false;
     }
   };
 
   const processFiles = async (newFiles: File[]) => {
     for (const file of newFiles) {
       const tempId = crypto.randomUUID();
       const tempFile: UploadedFile = {
         id: tempId,
         name: file.name,
         type: file.type,
         uploading: true,
       };
 
       setFiles(prev => [...prev, tempFile]);
 
       const success = await uploadFile(file);
       
       setFiles(prev => prev.map(f => 
         f.id === tempId 
           ? { ...f, uploading: false, uploaded: success }
           : f
       ));
 
       if (!success) {
         toast({
           title: "Upload failed",
           description: `Failed to upload ${file.name}`,
           variant: "destructive",
         });
       }
     }
   };
 
   const handleDrop = useCallback(async (e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(false);
     const droppedFiles = Array.from(e.dataTransfer.files);
     await processFiles(droppedFiles);
   }, [token]);
 
   const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files) {
       const selectedFiles = Array.from(e.target.files);
       await processFiles(selectedFiles);
     }
   }, [token]);
 
   const removeFile = (id: string) => {
     setFiles(prev => prev.filter(f => f.id !== id));
   };
 
   const addAnchorField = () => {
     setVisualAnchors(prev => [...prev, ""]);
   };
 
   const updateAnchor = (index: number, value: string) => {
     setVisualAnchors(prev => prev.map((a, i) => i === index ? value : a));
   };
 
   const removeAnchor = (index: number) => {
     setVisualAnchors(prev => prev.filter((_, i) => i !== index));
   };
 
   const handleComplete = async () => {
     setIsSubmitting(true);
 
     try {
       const validAnchors = visualAnchors.filter(a => a.trim().length > 0);
       
       const { data, error } = await supabase.functions.invoke("client-intake-upload", {
         body: {
           token,
           action: "complete",
           visual_anchors: validAnchors,
         },
       });
 
       if (error || data?.error) {
         throw new Error(data?.error || "Failed to complete onboarding");
       }
 
        setSubmittedClientName(clientName);
       setShowSuccess(true);
     } catch (err: any) {
       toast({
         title: "Error",
         description: err.message || "Failed to complete submission",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const getFileIcon = (type: string) => {
     if (type.startsWith("image/")) return FileImage;
     return FileText;
   };
 
   // Loading state
   if (isValidating) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="text-center">
           <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
           <p className="mt-4 text-muted-foreground font-serif">Validating access...</p>
         </div>
       </div>
     );
   }
 
   // Error state
   if (!isValid || error) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center px-4">
         <div className="text-center max-w-md">
           <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
             <X className="w-8 h-8 text-destructive" />
           </div>
           <h1 className="font-serif text-2xl text-foreground mb-3">Access Denied</h1>
           <p className="text-muted-foreground">
             {error || "This link is no longer valid or has expired. Please contact the team for a new access link."}
           </p>
         </div>
       </div>
     );
   }
 
    // Success Page UI
    if (showSuccess) {
      return (
        <div className="min-h-screen bg-background">
          <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 12 }}
                className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-8"
              >
                <Check className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </motion.div>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
                The Foundation is Set.
              </h1>
              <p className="text-muted-foreground text-lg">
                Thank you, {submittedClientName}. Your vision is now in our hands.
              </p>
            </motion.div>

            {/* Roadmap Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 mb-16"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
                What Happens Next
              </h2>
              
              {/* Strategy Review - In Progress */}
              <div className="flex items-start gap-4 p-5 rounded-lg border border-border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg text-foreground">Strategy Review</h3>
                    <span className="text-xs uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Our team is currently synthesising your Brand DNA.
                  </p>
                </div>
              </div>

              {/* Internal Alignment - Pending */}
              <div className="flex items-start gap-4 p-5 rounded-lg border border-border/50 bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg text-foreground/70">Internal Alignment</h3>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Pending
                    </span>
                  </div>
                  <p className="text-muted-foreground/70">
                    We will be in touch shortly.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Personal Note from Hannah */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border-t border-border pt-10"
            >
              <div className="flex items-start gap-5">
                <Avatar className="w-14 h-14 border-2 border-border">
                  <AvatarImage src="" alt="Hannah" />
                  <AvatarFallback className="bg-muted font-serif text-lg">H</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-serif text-lg text-foreground italic leading-relaxed mb-3">
                    "I've received your brief. We're diving in now."
                  </p>
                  <p className="text-muted-foreground">
                    — Hannah
                  </p>
                </div>
              </div>
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border/50 py-8 mt-16">
            <div className="max-w-2xl mx-auto px-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                House of Saiso
              </p>
            </div>
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Editorial Header */}
       <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
         <div className="max-w-3xl mx-auto px-6 py-6">
           <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
             Brand Asset Submission
           </p>
           <h1 className="font-serif text-2xl md:text-3xl text-foreground">
             {projectTitle}
           </h1>
           <p className="text-sm text-muted-foreground mt-1">
             for {clientName}
           </p>
         </div>
       </header>
 
       <main className="max-w-3xl mx-auto px-6 py-12">
         {/* Introduction */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12"
         >
           <p className="text-lg text-muted-foreground leading-relaxed font-serif italic">
             Share your brand world with us. Upload your logos, guidelines, fonts, 
             and any visual references that define your aesthetic.
           </p>
         </motion.div>
 
         {/* File Upload Section */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mb-16"
         >
           <h2 className="font-serif text-xl text-foreground mb-6 flex items-center gap-3">
             <span className="text-muted-foreground/50 font-normal">01</span>
             Brand Assets
           </h2>
 
           {/* Dropzone */}
           <div
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             className={cn(
               "relative border-2 border-dashed rounded-lg p-16 text-center transition-all cursor-pointer",
               isDragging
                 ? "border-primary bg-primary/5 scale-[1.02]"
                 : "border-border hover:border-primary/50"
             )}
           >
             <input
               type="file"
               multiple
               onChange={handleFileSelect}
               className="absolute inset-0 opacity-0 cursor-pointer"
               accept="image/*,.pdf,.ai,.eps,.svg,.otf,.ttf,.woff,.woff2,.zip"
             />
             <div className="flex flex-col items-center gap-4">
               <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                 <Upload className="w-8 h-8 text-muted-foreground" />
               </div>
               <div>
                 <p className="font-serif text-lg text-foreground italic">
                   Relinquish your brand assets here
                 </p>
                 <p className="text-sm text-muted-foreground mt-2">
                   or click to browse • Logos, Guidelines, Fonts, Photography
                 </p>
               </div>
             </div>
           </div>
 
           {/* Uploaded Files Gallery */}
           <AnimatePresence>
             {files.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
               >
                 {files.map((file) => {
                   const FileIcon = getFileIcon(file.type);
                   return (
                     <motion.div
                       key={file.id}
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="relative group"
                     >
                       <div className={cn(
                         "aspect-square rounded-lg border flex flex-col items-center justify-center p-4",
                         file.uploaded ? "bg-muted/30 border-primary/20" : "bg-muted/50 border-border"
                       )}>
                         {file.uploading ? (
                           <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                         ) : file.uploaded ? (
                           <div className="relative">
                             <FileIcon className="w-8 h-8 text-primary" />
                             <Check className="w-4 h-4 text-primary absolute -bottom-1 -right-1 bg-background rounded-full" />
                           </div>
                         ) : (
                           <FileIcon className="w-8 h-8 text-muted-foreground" />
                         )}
                       </div>
                       <p className="text-xs text-muted-foreground mt-1 truncate">
                         {file.name}
                       </p>
                       {!file.uploading && (
                         <Button
                           type="button"
                           variant="destructive"
                           size="icon"
                           className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={() => removeFile(file.id)}
                         >
                           <X className="w-3 h-3" />
                         </Button>
                       )}
                     </motion.div>
                   );
                 })}
               </motion.div>
             )}
           </AnimatePresence>
 
           {uploadedCount > 0 && (
             <p className="text-sm text-muted-foreground mt-4">
               {uploadedCount} file{uploadedCount !== 1 ? "s" : ""} uploaded to your project folder
             </p>
           )}
         </motion.section>
 
         {/* Visual Anchors Section */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mb-16"
         >
           <h2 className="font-serif text-xl text-foreground mb-2 flex items-center gap-3">
             <span className="text-muted-foreground/50 font-normal">02</span>
             Visual Anchors
           </h2>
           <p className="text-sm text-muted-foreground mb-6">
             Share links to Pinterest boards, Dribbble shots, websites, or any visual inspiration.
           </p>
 
           <div className="space-y-3">
             {visualAnchors.map((anchor, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex gap-2"
               >
                 <div className="relative flex-1">
                   <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     value={anchor}
                     onChange={(e) => updateAnchor(index, e.target.value)}
                     placeholder="https://pinterest.com/board/..."
                     className="pl-10 font-mono text-sm"
                   />
                 </div>
                 {visualAnchors.length > 1 && (
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     onClick={() => removeAnchor(index)}
                   >
                     <X className="w-4 h-4" />
                   </Button>
                 )}
               </motion.div>
             ))}
           </div>
 
           <Button
             type="button"
             variant="ghost"
             size="sm"
             onClick={addAnchorField}
             className="mt-3 gap-2 text-muted-foreground"
           >
             <Plus className="w-4 h-4" />
             Add another reference
           </Button>
         </motion.section>
 
         {/* Submit Section */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="border-t border-border pt-8"
         >
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-sm text-muted-foreground">
               {files.filter(f => f.uploaded).length > 0 || visualAnchors.some(a => a.trim())
                 ? "Ready to submit your brand assets"
                 : "Upload files or add visual references to continue"}
             </p>
             <Button
               onClick={handleComplete}
               disabled={isSubmitting || (files.filter(f => f.uploaded).length === 0 && !visualAnchors.some(a => a.trim()))}
               className="gap-2 min-w-[200px]"
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Submitting...
                 </>
               ) : (
                 <>
                   <Sparkles className="w-4 h-4" />
                   Complete Submission
                 </>
               )}
             </Button>
           </div>
         </motion.section>
       </main>
 
       {/* Footer */}
       <footer className="border-t border-border/50 py-8 mt-16">
         <div className="max-w-3xl mx-auto px-6 text-center">
           <p className="text-xs text-muted-foreground uppercase tracking-widest">
             House of Saiso
           </p>
         </div>
       </footer>
     </div>
   );
 }