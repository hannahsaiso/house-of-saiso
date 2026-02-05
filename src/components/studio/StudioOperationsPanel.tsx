 import { useState } from "react";
 import { motion } from "framer-motion";
 import { format } from "date-fns";
 import {
   CheckCircle2,
   Circle,
   Send,
   Wrench,
   Sparkles,
   Loader2,
   KeyRound,
   Clock,
   DollarSign,
 } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useStudioOperations, StudioOperationsTask } from "@/hooks/useStudioOperations";
 import { useSignatureRequests } from "@/hooks/useSignatureRequests";
 import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
 
 interface StudioOperationsPanelProps {
   bookingId: string;
   bookingStatus: string;
   clientId?: string | null;
   clientEmail?: string;
 }
 
 const taskIcons: Record<string, React.ElementType> = {
   space_prep: Sparkles,
 };
 
 const OVERTIME_OPTIONS = [
   { value: "30min", label: "30 minutes", amount: 75 },
   { value: "1hour", label: "1 hour", amount: 150 },
   { value: "2hours", label: "2 hours", amount: 300 },
 ];
 
 export function StudioOperationsPanel({
   bookingId,
   bookingStatus,
   clientId,
   clientEmail,
 }: StudioOperationsPanelProps) {
   const { tasks, isLoading, updateTaskStatus } = useStudioOperations(bookingId);
   const { pendingSignatures } = useSignatureRequests();
   const { entries, createEntry } = useFinancialEntries();
   const [sendingAccess, setSendingAccess] = useState(false);
   const [addingOvertime, setAddingOvertime] = useState(false);
   const [selectedOvertime, setSelectedOvertime] = useState<string | null>(null);
 
   // Check if studio rules are signed
  const signatureRequest = pendingSignatures.find(
     (r) => r.booking_id === bookingId && r.document_type === "studio_rules"
   );
  // If not found in pending, check if it was already completed (not in pending list)
  const rulesCompleted = signatureRequest ? signatureRequest.status === "completed" : false;
 
   // Check if invoice is paid
   const bookingInvoice = entries.find(
     (e) =>
       e.service_type === "studio" &&
       e.description?.toLowerCase().includes(bookingId.slice(0, 8))
   );
   const invoicePaid = bookingInvoice?.payment_status === "paid";
 
   // Entry access can only be sent when rules are signed AND invoice is paid
   const canSendAccess = bookingStatus === "confirmed" && rulesCompleted && invoicePaid;
 
   const handleSendAccess = async () => {
     setSendingAccess(true);
     try {
       // Mark the entry instructions task as completed
       const entryTask = tasks.find((t) => t.task_type === "entry_instructions");
       if (entryTask) {
         await updateTaskStatus.mutateAsync({
           taskId: entryTask.id,
           status: "completed",
         });
       }
       toast.success("Entry access information sent to client");
     } catch (error) {
       toast.error("Failed to send access info");
     } finally {
       setSendingAccess(false);
     }
   };
 
   const handleAddOvertime = async () => {
     if (!selectedOvertime) return;
     
     const overtimeOption = OVERTIME_OPTIONS.find((o) => o.value === selectedOvertime);
     if (!overtimeOption) return;
     
     setAddingOvertime(true);
     try {
       await createEntry.mutateAsync({
         date: new Date().toISOString().split("T")[0],
         client_id: clientId || undefined,
         service_type: "studio",
         description: `Overtime: ${overtimeOption.label} (Booking ${bookingId.slice(0, 8)})`,
         amount: overtimeOption.amount,
         payment_status: "sent",
       });
       toast.success(`Overtime charge of $${overtimeOption.amount} added to ledger`);
       setSelectedOvertime(null);
     } catch (error) {
       toast.error("Failed to add overtime charge");
     } finally {
       setAddingOvertime(false);
     }
   };
 
   const toggleTaskStatus = async (task: StudioOperationsTask) => {
     const newStatus = task.status === "completed" ? "pending" : "completed";
     await updateTaskStatus.mutateAsync({ taskId: task.id, status: newStatus });
   };
 
   if (bookingStatus !== "confirmed" || isLoading) {
     return null;
   }
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="mt-4"
     >
       <Card className="border-primary/20 bg-primary/5">
         <CardHeader className="pb-3">
           <CardTitle className="flex items-center gap-2 text-sm font-medium">
             <Wrench className="h-4 w-4 text-primary" />
             Studio Operations Checklist
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {tasks.map((task) => {
             const Icon = taskIcons[task.task_type] || Circle;
             const isCompleted = task.status === "completed";
 
             return (
               <div
                 key={task.id}
                 onClick={() => toggleTaskStatus(task)}
                 className={cn(
                   "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                   isCompleted
                     ? "border-green-500/30 bg-green-500/10"
                     : "border-border/50 hover:border-primary/30"
                 )}
               >
                 {isCompleted ? (
                   <CheckCircle2 className="h-5 w-5 text-green-500" />
                 ) : (
                   <Circle className="h-5 w-5 text-muted-foreground" />
                 )}
                 <div className="flex-1">
                   <p
                     className={cn(
                       "text-sm font-medium",
                       isCompleted && "line-through text-muted-foreground"
                     )}
                   >
                     {task.task_name}
                   </p>
                   {task.completed_at && (
                     <p className="text-xs text-muted-foreground">
                       Completed {format(new Date(task.completed_at), "MMM d, h:mm a")}
                     </p>
                   )}
                 </div>
                 <Icon className="h-4 w-4 text-muted-foreground" />
               </div>
             );
           })}
 
           {/* Send Access Info Button */}
           <div className="pt-2 border-t border-border/50">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <KeyRound className="h-4 w-4 text-primary" />
                 <span className="text-sm font-medium">Entry Access</span>
               </div>
               <div className="flex gap-2">
                 <Badge
                   variant={rulesCompleted ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    rulesCompleted && "bg-[hsl(var(--vault-success))] hover:bg-[hsl(var(--vault-success))]"
                  )}
                 >
                   {rulesCompleted ? "Rules Signed ✓" : "Rules Pending"}
                 </Badge>
                 <Badge
                   variant={invoicePaid ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    invoicePaid && "bg-[hsl(var(--vault-success))] hover:bg-[hsl(var(--vault-success))]"
                  )}
                 >
                   {invoicePaid ? "Paid ✓" : "Payment Pending"}
                 </Badge>
               </div>
             </div>
             <Button
               onClick={handleSendAccess}
               disabled={!canSendAccess || sendingAccess}
               className="w-full"
               variant={canSendAccess ? "default" : "secondary"}
             >
               {sendingAccess ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               ) : (
                 <Send className="mr-2 h-4 w-4" />
               )}
               Send Access Info
             </Button>
             {!canSendAccess && (
               <p className="text-xs text-muted-foreground text-center mt-2">
                 Requires signed Studio Rules and paid invoice
               </p>
             )}
           </div>
 
           {/* Add Overtime Button */}
           <div className="pt-2 border-t border-border/50">
             <div className="flex items-center gap-2 mb-2">
               <Clock className="h-4 w-4 text-primary" />
               <span className="text-sm font-medium">Add Overtime</span>
             </div>
             <div className="flex gap-2">
               <Select
                 value={selectedOvertime || ""}
                 onValueChange={setSelectedOvertime}
               >
                 <SelectTrigger className="flex-1">
                   <SelectValue placeholder="Select duration" />
                 </SelectTrigger>
                 <SelectContent>
                   {OVERTIME_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                       {option.label} (${option.amount})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button
                 onClick={handleAddOvertime}
                 disabled={!selectedOvertime || addingOvertime}
                 size="sm"
               >
                 {addingOvertime ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   <DollarSign className="h-4 w-4" />
                 )}
               </Button>
             </div>
             <p className="text-xs text-muted-foreground text-center mt-2">
               Creates pending line item in Vault Ledger
             </p>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }