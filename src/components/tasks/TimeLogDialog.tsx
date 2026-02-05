 import { useState } from "react";
 import { motion } from "framer-motion";
 import { Clock, Plus, Trash2 } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { useTimeLogs } from "@/hooks/useTimeLogs";
 import { format } from "date-fns";
 
 interface TimeLogDialogProps {
   taskId: string;
   projectId: string;
   taskTitle: string;
   currentHours: number;
 }
 
 export function TimeLogDialog({ taskId, projectId, taskTitle, currentHours }: TimeLogDialogProps) {
   const [open, setOpen] = useState(false);
   const [hours, setHours] = useState("");
   const [description, setDescription] = useState("");
   const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
   
   const { logs, createLog, deleteLog, isLoading } = useTimeLogs(undefined, taskId);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!hours || parseFloat(hours) <= 0) return;
 
     await createLog.mutateAsync({
       task_id: taskId,
       project_id: projectId,
       hours: parseFloat(hours),
       description: description || undefined,
       log_date: logDate,
     });
 
     setHours("");
     setDescription("");
   };
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
           <Clock className="h-3 w-3" />
           <span className="font-mono-ledger tabular-nums">{currentHours.toFixed(1)}h</span>
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle className="font-heading text-lg">
             Log Time
           </DialogTitle>
           <p className="text-sm text-muted-foreground truncate">
             {taskTitle}
           </p>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="hours" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                 Hours
               </Label>
               <Input
                 id="hours"
                 type="number"
                 step="0.25"
                 min="0.25"
                 placeholder="0.0"
                 value={hours}
                 onChange={(e) => setHours(e.target.value)}
                 className="font-mono-ledger"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="date" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                 Date
               </Label>
               <Input
                 id="date"
                 type="date"
                 value={logDate}
                 onChange={(e) => setLogDate(e.target.value)}
                 className="font-mono-ledger"
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="description" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
               Description (optional)
             </Label>
             <Textarea
               id="description"
               placeholder="What did you work on?"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="resize-none"
               rows={2}
             />
           </div>
 
           <Button type="submit" className="w-full gap-2" disabled={createLog.isPending}>
             <Plus className="h-4 w-4" />
             Log Time
           </Button>
         </form>
 
         {/* Recent Logs */}
         {logs.length > 0 && (
           <div className="mt-4 space-y-2">
             <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
               Recent Logs
             </p>
             <div className="max-h-40 space-y-1.5 overflow-y-auto">
               {logs.slice(0, 5).map((log) => (
                 <motion.div
                   key={log.id}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                 >
                   <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-2">
                       <span className="font-mono-ledger text-sm font-semibold tabular-nums">
                         {Number(log.hours).toFixed(1)}h
                       </span>
                       <span className="font-mono text-xs text-muted-foreground">
                         {format(new Date(log.log_date), "MMM d")}
                       </span>
                     </div>
                     {log.description && (
                       <p className="truncate text-xs text-muted-foreground">
                         {log.description}
                       </p>
                     )}
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                     onClick={() => deleteLog.mutate(log.id)}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 </motion.div>
               ))}
             </div>
           </div>
         )}
 
         {/* Total */}
         <div className="flex items-center justify-between border-t pt-4">
           <span className="text-sm text-muted-foreground">Total Logged</span>
           <span className="font-mono-ledger text-lg font-bold tabular-nums">
             {currentHours.toFixed(1)} hours
           </span>
         </div>
       </DialogContent>
     </Dialog>
   );
 }