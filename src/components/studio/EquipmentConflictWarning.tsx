 import { AlertTriangle } from "lucide-react";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 
 interface ConflictInfo {
   inventory_id: string;
   booking_id: string;
   reserved_from: string;
   reserved_until: string;
   inventory?: {
     item_name: string;
   } | null;
 }
 
 interface EquipmentConflictWarningProps {
   conflicts: ConflictInfo[];
 }
 
 export function EquipmentConflictWarning({ conflicts }: EquipmentConflictWarningProps) {
   if (!conflicts || conflicts.length === 0) return null;
 
   const itemNames = conflicts
     .map((c) => c.inventory?.item_name || "Unknown item")
     .filter((name, index, self) => self.indexOf(name) === index);
 
   return (
     <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
       <AlertTriangle className="h-5 w-5" />
       <AlertTitle className="font-semibold">Equipment Conflict Detected</AlertTitle>
       <AlertDescription className="mt-2">
         <p className="text-sm">
           The following gear is already reserved for a Studio Booking during this time:
         </p>
         <ul className="mt-2 list-disc list-inside text-sm font-medium">
           {itemNames.map((name) => (
             <li key={name}>{name}</li>
           ))}
         </ul>
         <p className="mt-2 text-xs text-destructive/80">
           Studio Bookings have priority. Consider selecting different equipment or dates.
         </p>
       </AlertDescription>
     </Alert>
   );
 }