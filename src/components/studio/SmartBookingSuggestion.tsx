 import { motion, AnimatePresence } from "framer-motion";
 import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface SmartBookingSuggestionProps {
   isLoading: boolean;
   suggestion: string | null;
   alternatives?: Array<{ id: string; item_name: string; category: string }>;
   onAcceptAlternative?: (id: string) => void;
   onDismiss: () => void;
 }
 
 export function SmartBookingSuggestion({
   isLoading,
   suggestion,
   alternatives,
   onAcceptAlternative,
   onDismiss,
 }: SmartBookingSuggestionProps) {
   return (
     <AnimatePresence>
       {(isLoading || suggestion) && (
         <motion.div
           initial={{ opacity: 0, y: -10, height: 0 }}
           animate={{ opacity: 1, y: 0, height: "auto" }}
           exit={{ opacity: 0, y: -10, height: 0 }}
           transition={{ duration: 0.3, ease: "easeOut" }}
           className="overflow-hidden"
         >
           <div className={cn(
             "rounded-lg border p-4",
             "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
             "border-primary/20"
           )}>
             <div className="flex items-start gap-3">
               <div className="rounded-full bg-primary/10 p-2">
                 {isLoading ? (
                   <Loader2 className="h-4 w-4 animate-spin text-primary" />
                 ) : (
                   <Sparkles className="h-4 w-4 text-primary" />
                 )}
               </div>
               <div className="flex-1 space-y-2">
                 <p className="text-xs font-heading font-medium uppercase tracking-editorial text-primary">
                   AI Suggestion
                 </p>
                 {isLoading ? (
                   <div className="space-y-2">
                     <div className="h-4 w-3/4 animate-shimmer rounded bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%]" />
                     <div className="h-4 w-1/2 animate-shimmer rounded bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%]" />
                   </div>
                 ) : (
                   <p className="font-heading text-sm leading-relaxed">{suggestion}</p>
                 )}
                 
                 {!isLoading && alternatives && alternatives.length > 0 && (
                   <div className="mt-3 flex flex-wrap gap-2">
                     {alternatives.slice(0, 3).map((alt) => (
                       <Button
                         key={alt.id}
                         size="sm"
                         variant="outline"
                         className="h-7 gap-1 text-xs"
                         onClick={() => onAcceptAlternative?.(alt.id)}
                       >
                         {alt.item_name}
                         <ArrowRight className="h-3 w-3" />
                       </Button>
                     ))}
                   </div>
                 )}
               </div>
               {!isLoading && (
                 <Button
                   size="sm"
                   variant="ghost"
                   className="h-7 text-xs text-muted-foreground"
                   onClick={onDismiss}
                 >
                   Dismiss
                 </Button>
               )}
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }