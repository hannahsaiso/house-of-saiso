import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, FileText, Users } from "lucide-react";
import { NewProjectDialog } from "./NewProjectDialog";
import { BookStudioDialog } from "./BookStudioDialog";
import { AddDocumentDialog } from "./AddDocumentDialog";
import { InviteUserDialog } from "./InviteUserDialog";

interface QuickActionsProps {
  userRole?: "admin" | "staff" | "client" | null;
}

export function QuickActions({ userRole = "admin" }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap gap-3"
    >
      {/* New Project - available to all */}
      <NewProjectDialog
        trigger={
          <Button
            variant="outline"
            className="gap-2 border-border/50 text-xs font-medium uppercase tracking-wide transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {/* Book Studio - available to all */}
      <BookStudioDialog
        trigger={
          <Button
            variant="outline"
            className="gap-2 border-border/50 text-xs font-medium uppercase tracking-wide transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Calendar className="h-4 w-4" />
            Book Studio
          </Button>
        }
      />

      {/* Add Document - admin and staff only */}
      {userRole !== "client" && (
        <AddDocumentDialog
          trigger={
            <Button
              variant="outline"
              className="gap-2 border-border/50 text-xs font-medium uppercase tracking-wide transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="h-4 w-4" />
              Add Document
            </Button>
          }
        />
      )}

      {/* Invite User - admin only */}
      {userRole === "admin" && (
        <InviteUserDialog
          trigger={
            <Button
              variant="outline"
              className="gap-2 border-border/50 text-xs font-medium uppercase tracking-wide transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              Invite User
            </Button>
          }
        />
      )}
    </motion.div>
  );
}
