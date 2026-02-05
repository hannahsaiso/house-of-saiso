 import { Badge } from "@/components/ui/badge";
 import { useIntakeCanvas } from "@/hooks/useIntakeCanvas";
 
 interface ProjectDnaTagsProps {
   projectId: string;
 }
 
 export function ProjectDnaTags({ projectId }: ProjectDnaTagsProps) {
   const { vault } = useIntakeCanvas(projectId);
 
   if (!vault || (!vault.pillar_tags?.length && !vault.tone_tags?.length)) {
     return null;
   }
 
   return (
     <div className="flex flex-wrap gap-1.5">
       {vault.pillar_tags?.slice(0, 3).map((pillar, index) => (
         <Badge
           key={`pillar-${index}`}
           variant="outline"
           className="border-primary/30 bg-primary/5 text-foreground text-[10px] px-2 py-0.5"
         >
           {pillar}
         </Badge>
       ))}
       {vault.tone_tags?.slice(0, 1).map((tone, index) => (
         <Badge
           key={`tone-${index}`}
           variant="outline"
           className="border-accent/50 bg-accent/10 text-foreground text-[10px] px-2 py-0.5"
         >
           {tone}
         </Badge>
       ))}
     </div>
   );
 }