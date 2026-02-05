import { useState } from "react";
import { Pin, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailData: {
    threadId: string;
    subject: string;
    from: string;
    body: string;
    date: Date;
  } | null;
}

export function PinToProjectDialog({
  open,
  onOpenChange,
  emailData,
}: PinToProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { activeProjects, isLoading: projectsLoading } = useProjects();
  const queryClient = useQueryClient();

  const pinToProject = useMutation({
    mutationFn: async () => {
      if (!emailData || !selectedProjectId) throw new Error("Missing data");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("project_changelog")
        .insert({
          project_id: selectedProjectId,
          entry_type: "email",
          title: emailData.subject,
          content: emailData.body,
          source_email_thread_id: emailData.threadId,
          source_email_from: emailData.from,
          source_email_date: emailData.date.toISOString(),
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-changelog"] });
      toast.success("Email pinned to project", { duration: 2000 });
      onOpenChange(false);
      setSelectedProjectId("");
    },
    onError: (error) => {
      toast.error("Failed to pin email: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Pin className="h-4 w-4" />
            Pin to Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-1">Email</p>
            <p className="text-sm text-muted-foreground truncate">
              {emailData?.subject}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Select Project</p>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  activeProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span>{project.title}</span>
                        {project.client?.name && (
                          <span className="text-xs text-muted-foreground">
                            {project.client.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            This will copy the email content to the project's Change Log.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => pinToProject.mutate()}
            disabled={!selectedProjectId || pinToProject.isPending}
          >
            {pinToProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Pin Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
