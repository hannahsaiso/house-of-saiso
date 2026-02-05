import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Send, ExternalLink } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useIntakeToken } from "@/hooks/useIntakeToken";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareOnboardingDialogProps {
  trigger: React.ReactNode;
}

export function ShareOnboardingDialog({ trigger }: ShareOnboardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { projects, isLoading: projectsLoading } = useProjects();
  const { toast } = useToast();

  // Only fetch intake token when a project is selected
  const {
    intakeToken,
    isLoading: tokenLoading,
    createToken,
    getIntakeUrl,
    isCompleted,
    uploadedCount,
  } = useIntakeToken(selectedProjectId);

  const intakeUrl = getIntakeUrl();

  const getStatusBadge = () => {
    if (!selectedProjectId) return null;
    
    if (isCompleted) {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Completed ({uploadedCount} files)
        </Badge>
      );
    }
    
    if (intakeToken) {
      return (
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          Sent - Awaiting Response
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not Sent
      </Badge>
    );
  };

  const handleCopyLink = async () => {
    if (!intakeUrl) return;
    
    try {
      await navigator.clipboard.writeText(intakeUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The onboarding link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedProjectId) return;
    
    try {
      await createToken.mutateAsync(undefined);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Share Onboarding Link</DialogTitle>
          <DialogDescription>
            Generate a unique intake link for a client project. They can submit brand assets and project details directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={projectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Display */}
          {selectedProjectId && (
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-sm text-muted-foreground">Status</span>
              {tokenLoading ? (
                <span className="text-sm text-muted-foreground">Loading...</span>
              ) : (
                getStatusBadge()
              )}
            </div>
          )}

          {/* Generated URL */}
          {intakeUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Onboarding Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2">
                  <p className="truncate text-sm font-mono text-muted-foreground">
                    {intakeUrl}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!intakeToken && selectedProjectId && (
              <Button
                onClick={handleGenerateLink}
                disabled={createToken.isPending || !selectedProjectId}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                Generate Link
              </Button>
            )}
            
            {intakeUrl && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-1 gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(intakeUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground">
            When the client submits their information, it will be automatically mapped to{" "}
            <span className="font-medium">{selectedProject?.title || "the project"}</span>'s 
            Knowledge Vault and Drive folder.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
