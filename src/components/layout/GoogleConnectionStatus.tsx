 import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
 import { cn } from "@/lib/utils";
 import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 
 export function GoogleConnectionStatus() {
   const { isConnected, isTokenExpired, isLoading } = useGoogleOAuth();
 
   if (isLoading) {
     return (
       <div className="flex items-center gap-2">
         <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
         <span className="text-[10px] text-muted-foreground/50">...</span>
       </div>
     );
   }
 
   if (!isConnected) {
     return null;
   }
 
   const isActive = isConnected && !isTokenExpired;
 
   return (
     <Tooltip>
       <TooltipTrigger asChild>
         <div className="flex items-center gap-1.5 cursor-help">
           <div
             className={cn(
               "h-1.5 w-1.5 rounded-full",
               isActive ? "bg-primary" : "bg-destructive"
             )}
           />
           <span className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
             {isActive ? "On" : "!"}
           </span>
         </div>
       </TooltipTrigger>
       <TooltipContent side="right">
         <p className="text-xs">
           {isActive
             ? "Google Workspace connected"
             : "Connection needs refresh"}
         </p>
       </TooltipContent>
     </Tooltip>
   );
 }