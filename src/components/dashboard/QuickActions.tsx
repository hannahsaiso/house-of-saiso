import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, Users } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface QuickActionsProps {
  userRole?: "admin" | "staff" | "client";
}

export function QuickActions({ userRole = "admin" }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: "New Project",
      icon: Plus,
      onClick: () => console.log("New project"),
    },
    {
      label: "Book Studio",
      icon: Calendar,
      onClick: () => console.log("Book studio"),
    },
    ...(userRole !== "client"
      ? [
          {
            label: "Add Document",
            icon: FileText,
            onClick: () => console.log("Add document"),
          },
        ]
      : []),
    ...(userRole === "admin"
      ? [
          {
            label: "Invite User",
            icon: Users,
            onClick: () => console.log("Invite user"),
          },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap gap-3"
    >
      {actions.map((action, index) => (
        <Button
          key={action.label}
          variant="outline"
          onClick={action.onClick}
          className="gap-2 border-border/50 text-xs font-medium uppercase tracking-wide transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </motion.div>
  );
}
