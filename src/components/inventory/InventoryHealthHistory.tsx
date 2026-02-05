 import { format } from "date-fns";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Wrench,
   Sparkles,
   Package,
   AlertTriangle,
   CheckCircle2,
   Loader2,
 } from "lucide-react";
 import { useInventoryLogs, InventoryLog } from "@/hooks/useInventoryLogs";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 interface InventoryHealthHistoryProps {
   inventoryId: string;
 }
 
 const logTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
   used: { icon: Package, color: "text-blue-500", label: "Used" },
   repaired: { icon: Wrench, color: "text-amber-500", label: "Repaired" },
   cleaned: { icon: Sparkles, color: "text-green-500", label: "Cleaned" },
   flagged_maintenance: { icon: AlertTriangle, color: "text-red-500", label: "Flagged" },
   cleared_maintenance: { icon: CheckCircle2, color: "text-green-500", label: "Cleared" },
 };
 
 export function InventoryHealthHistory({ inventoryId }: InventoryHealthHistoryProps) {
   const { logs, isLoading } = useInventoryLogs(inventoryId);
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-6">
         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (logs.length === 0) {
     return (
       <p className="py-4 text-center text-xs text-muted-foreground font-mono-ledger">
         No history recorded
       </p>
     );
   }
 
   return (
     <ScrollArea className="h-[200px]">
       <div className="space-y-2 pr-3">
         <AnimatePresence>
           {logs.map((log, index) => {
             const config = logTypeConfig[log.log_type] || logTypeConfig.used;
             const Icon = config.icon;
 
             return (
               <motion.div
                 key={log.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.05 }}
                 className="flex items-start gap-2 rounded border border-border/50 bg-muted/30 p-2"
               >
                 <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
                 <div className="min-w-0 flex-1">
                   <p className="font-mono-ledger text-[11px] leading-tight text-foreground">
                     {log.description}
                   </p>
                   <div className="mt-1 flex items-center gap-2 font-mono-ledger text-[10px] text-muted-foreground">
                     <span>{format(new Date(log.log_date), "MMM d, yyyy")}</span>
                     {log.performed_by_name && (
                       <>
                         <span>•</span>
                         <span>{log.performed_by_name}</span>
                       </>
                     )}
                   </div>
                 </div>
               </motion.div>
             );
           })}
         </AnimatePresence>
       </div>
     </ScrollArea>
   );
 }