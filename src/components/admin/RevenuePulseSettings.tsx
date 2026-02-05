 import { useState, useEffect } from "react";
 import { Settings, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { toast } from "sonner";
 
 export interface RevenuePulseConfig {
   goal: number;
   taxReservePercent: number;
   monthlyFixedCosts: number;
 }
 
 interface RevenuePulseSettingsProps {
   config: RevenuePulseConfig;
   onSave: (config: RevenuePulseConfig) => void;
 }
 
 export function RevenuePulseSettings({ config, onSave }: RevenuePulseSettingsProps) {
   const [open, setOpen] = useState(false);
   const [formData, setFormData] = useState(config);
 
   useEffect(() => {
     setFormData(config);
   }, [config]);
 
   const handleSave = () => {
     if (formData.taxReservePercent < 0 || formData.taxReservePercent > 100) {
       toast.error("Tax reserve must be between 0-100%");
       return;
     }
     if (formData.monthlyFixedCosts < 0) {
       toast.error("Fixed costs cannot be negative");
       return;
     }
     if (formData.goal <= 0) {
       toast.error("Revenue goal must be positive");
       return;
     }
     onSave(formData);
     setOpen(false);
     toast.success("Revenue Pulse settings updated");
   };
 
   return (
     <>
       <Button
         variant="ghost"
         size="icon"
         className="h-5 w-5 opacity-60 hover:opacity-100"
         onClick={() => setOpen(true)}
       >
         <Settings className="h-3 w-3" />
       </Button>
 
       <Dialog open={open} onOpenChange={setOpen}>
         <DialogContent className="sm:max-w-[360px]">
           <DialogHeader>
             <DialogTitle className="font-heading">Revenue Pulse Settings</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label className="text-xs">Monthly Revenue Goal ($)</Label>
               <Input
                 type="number"
                 value={formData.goal}
                 onChange={(e) =>
                   setFormData({ ...formData, goal: Number(e.target.value) })
                 }
                 className="font-mono-ledger"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-xs">Tax Reserve (%)</Label>
               <Input
                 type="number"
                 min={0}
                 max={100}
                 value={formData.taxReservePercent}
                 onChange={(e) =>
                   setFormData({ ...formData, taxReservePercent: Number(e.target.value) })
                 }
                 className="font-mono-ledger"
               />
               <p className="text-[10px] text-muted-foreground">
                 Percentage reserved for taxes
               </p>
             </div>
             <div className="space-y-2">
               <Label className="text-xs">Monthly Fixed Costs ($)</Label>
               <Input
                 type="number"
                 min={0}
                 value={formData.monthlyFixedCosts}
                 onChange={(e) =>
                   setFormData({ ...formData, monthlyFixedCosts: Number(e.target.value) })
                 }
                 className="font-mono-ledger"
               />
               <p className="text-[10px] text-muted-foreground">
                 Rent, utilities, subscriptions, etc.
               </p>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setOpen(false)}>
               Cancel
             </Button>
             <Button onClick={handleSave}>Save</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 }