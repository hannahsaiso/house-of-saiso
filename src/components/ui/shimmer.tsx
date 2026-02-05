 import { cn } from "@/lib/utils";
 
 interface ShimmerProps {
   className?: string;
 }
 
 export function Shimmer({ className }: ShimmerProps) {
   return (
     <div
       className={cn(
         "animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent bg-[length:200%_100%]",
         className
       )}
     />
   );
 }
 
 export function ShimmerText({ className }: ShimmerProps) {
   return (
     <div className={cn("space-y-2", className)}>
       <Shimmer className="h-4 w-3/4 rounded" />
       <Shimmer className="h-4 w-1/2 rounded" />
     </div>
   );
 }
 
 export function ShimmerCard({ className }: ShimmerProps) {
   return (
     <div className={cn("rounded-lg border border-border/50 p-4 space-y-3", className)}>
       <Shimmer className="h-5 w-1/3 rounded" />
       <Shimmer className="h-4 w-full rounded" />
       <Shimmer className="h-4 w-2/3 rounded" />
     </div>
   );
 }