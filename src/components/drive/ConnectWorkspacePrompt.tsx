 import { motion } from "framer-motion";
 import { Cloud, ArrowRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useNavigate } from "react-router-dom";
 
 interface ConnectWorkspacePromptProps {
   title?: string;
   description?: string;
   feature?: "mail" | "drive" | "calendar";
 }
 
 export function ConnectWorkspacePrompt({
   title = "Connect Google Workspace",
   description,
   feature = "drive",
 }: ConnectWorkspacePromptProps) {
   const navigate = useNavigate();
 
   const getDefaultDescription = () => {
     switch (feature) {
       case "mail":
         return "Link your Google Workspace account to access your Gmail inbox directly from this dashboard. Your emails remain private and are never stored on our servers.";
       case "drive":
         return "Connect your Google Workspace to access and organize your Drive files. Easily attach documents to projects and share assets with your team.";
       case "calendar":
         return "Sync your Google Calendar to see all your events alongside studio bookings and project deadlines in one unified view.";
       default:
         return "Connect your Google Workspace account to unlock powerful integrations for your workflow.";
     }
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
       className="flex min-h-[60vh] items-center justify-center"
     >
       <div className="mx-auto max-w-md text-center">
         <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.1, duration: 0.4 }}
           className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
         >
           <Cloud className="h-10 w-10 text-primary" />
         </motion.div>
 
         <motion.h2
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="font-heading text-2xl font-semibold tracking-tight"
         >
           {title}
         </motion.h2>
 
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-4 text-muted-foreground leading-relaxed"
         >
           {description || getDefaultDescription()}
         </motion.p>
 
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-8"
         >
           <Button
             size="lg"
             onClick={() => navigate("/settings/profile")}
             className="gap-2"
           >
             Connect Workspace
             <ArrowRight className="h-4 w-4" />
           </Button>
         </motion.div>
 
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-6 text-xs text-muted-foreground/70"
         >
           Your data stays private. We only access what you authorize.
         </motion.p>
       </div>
     </motion.div>
   );
 }