 import { useEffect, useCallback, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { X, ExternalLink, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface FilePreviewLightboxProps {
   isOpen: boolean;
   onClose: () => void;
   file: {
     id: string;
     name: string;
     mimeType: string;
    webViewLink?: string;
     webContentLink?: string;
     thumbnailLink?: string;
   } | null;
   onNext?: () => void;
   onPrevious?: () => void;
   hasNext?: boolean;
   hasPrevious?: boolean;
 }
 
 export function FilePreviewLightbox({
   isOpen,
   onClose,
   file,
   onNext,
   onPrevious,
   hasNext,
   hasPrevious,
 }: FilePreviewLightboxProps) {
   const [isImageLoading, setIsImageLoading] = useState(true);
 
   const handleKeyDown = useCallback(
     (e: KeyboardEvent) => {
       if (!isOpen) return;
       
       switch (e.key) {
         case "Escape":
           onClose();
           break;
         case "ArrowRight":
           if (hasNext && onNext) onNext();
           break;
         case "ArrowLeft":
           if (hasPrevious && onPrevious) onPrevious();
           break;
         case " ":
           e.preventDefault();
           onClose();
           break;
       }
     },
     [isOpen, onClose, onNext, onPrevious, hasNext, hasPrevious]
   );
 
   useEffect(() => {
     document.addEventListener("keydown", handleKeyDown);
     return () => document.removeEventListener("keydown", handleKeyDown);
   }, [handleKeyDown]);
 
   useEffect(() => {
     if (isOpen) {
       document.body.style.overflow = "hidden";
     } else {
       document.body.style.overflow = "";
     }
     return () => {
       document.body.style.overflow = "";
     };
   }, [isOpen]);
 
   useEffect(() => {
     if (file) {
       setIsImageLoading(true);
     }
   }, [file?.id]);
 
   const isImage = file?.mimeType.includes("image");
   const isVideo = file?.mimeType.includes("video");
   const isPdf = file?.mimeType.includes("pdf");
   const isGoogleDoc = file?.mimeType.includes("google-apps");
 
   const getPreviewUrl = () => {
     if (!file) return null;
     
     if (isImage && file.webContentLink) {
       return file.webContentLink;
     }
     if (file.thumbnailLink) {
       // Get higher resolution thumbnail
       return file.thumbnailLink.replace("=s220", "=s1600");
     }
     return null;
   };
 
   const previewUrl = getPreviewUrl();
 
   return (
     <AnimatePresence>
       {isOpen && file && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.2 }}
           className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
           onClick={onClose}
         >
           {/* Header */}
           <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4"
           >
             <div className="min-w-0 flex-1 pr-4">
               <h3 className="truncate font-heading text-lg font-medium text-white">
                 {file.name}
               </h3>
               <p className="font-mono text-xs text-white/50">
                 Press ESC or Space to close • Arrow keys to navigate
               </p>
             </div>
             <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="sm"
                 className="text-white/70 hover:bg-white/10 hover:text-white"
                 asChild
               >
                 <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                   <ExternalLink className="h-4 w-4" />
                 </a>
               </Button>
               {file.webContentLink && (
                 <Button
                   variant="ghost"
                   size="sm"
                   className="text-white/70 hover:bg-white/10 hover:text-white"
                   asChild
                 >
                   <a href={file.webContentLink} download>
                     <Download className="h-4 w-4" />
                   </a>
                 </Button>
               )}
               <Button
                 variant="ghost"
                 size="icon"
                 className="text-white/70 hover:bg-white/10 hover:text-white"
                 onClick={onClose}
               >
                 <X className="h-5 w-5" />
               </Button>
             </div>
           </motion.div>
 
           {/* Navigation Arrows */}
           {hasPrevious && onPrevious && (
             <Button
               variant="ghost"
               size="icon"
               className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
               onClick={(e) => {
                 e.stopPropagation();
                 onPrevious();
               }}
             >
               <ChevronLeft className="h-6 w-6" />
             </Button>
           )}
           {hasNext && onNext && (
             <Button
               variant="ghost"
               size="icon"
               className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
               onClick={(e) => {
                 e.stopPropagation();
                 onNext();
               }}
             >
               <ChevronRight className="h-6 w-6" />
             </Button>
           )}
 
           {/* Content */}
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             transition={{ duration: 0.2 }}
             className="relative max-h-[85vh] max-w-[90vw]"
             onClick={(e) => e.stopPropagation()}
           >
             {isImage && previewUrl ? (
               <>
                 {isImageLoading && (
                   <div className="flex h-64 w-64 items-center justify-center">
                     <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                   </div>
                 )}
                 <img
                   src={previewUrl}
                   alt={file.name}
                   className={cn(
                     "max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl",
                     isImageLoading && "hidden"
                   )}
                   onLoad={() => setIsImageLoading(false)}
                   onError={() => setIsImageLoading(false)}
                 />
               </>
             ) : isVideo ? (
               <div className="flex h-64 flex-col items-center justify-center text-center">
                 <p className="font-heading text-lg text-white">Video Preview</p>
                 <p className="mt-2 text-sm text-white/50">
                   Click "Open in Drive" to view this video
                 </p>
                 <Button className="mt-4" asChild>
                   <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                     <ExternalLink className="mr-2 h-4 w-4" />
                     Open in Drive
                   </a>
                 </Button>
               </div>
             ) : previewUrl ? (
               <img
                 src={previewUrl}
                 alt={file.name}
                 className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
               />
             ) : (
               <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-white/5 px-12 text-center">
                 <p className="font-heading text-lg text-white">{file.name}</p>
                 <p className="mt-2 text-sm text-white/50">
                   Preview not available for this file type
                 </p>
                {file.webViewLink && (
                  <Button className="mt-4" asChild>
                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Drive
                    </a>
                  </Button>
                )}
               </div>
             )}
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }