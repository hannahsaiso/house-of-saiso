import { useState } from "react";
import { motion } from "framer-motion";
  import { Folder, Plus, ExternalLink, Trash2, FolderOpen, Copy, Check, Upload, Link2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProjectResources } from "@/hooks/useProjectResources";
import { useUserRole } from "@/hooks/useUserRole";
  import { useIntakeToken } from "@/hooks/useIntakeToken";
 import { toast } from "sonner";

interface ResourcesTabProps {
  projectId: string;
   brandAssetsFolderId?: string | null;
    clientId?: string | null;
}

  export function ResourcesTab({ projectId, brandAssetsFolderId, clientId }: ResourcesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
   const [copied, setCopied] = useState(false);
    const [intakeCopied, setIntakeCopied] = useState(false);
  const { driveLinks, addResource, removeResource, isLoading } = useProjectResources(projectId);
  const { isAdminOrStaff } = useUserRole();
    const { 
      intakeToken, 
      createToken, 
      regenerateToken, 
      getIntakeUrl, 
      isCompleted, 
      uploadedCount 
    } = useIntakeToken(projectId);

   const uploadFolderUrl = brandAssetsFolderId
     ? `https://drive.google.com/drive/folders/${brandAssetsFolderId}?usp=sharing`
     : null;
 
   const handleCopyUploadLink = async () => {
     if (!uploadFolderUrl) return;
     try {
       await navigator.clipboard.writeText(uploadFolderUrl);
       setCopied(true);
       toast.success("Upload link copied to clipboard");
       setTimeout(() => setCopied(false), 2000);
     } catch {
       toast.error("Failed to copy link");
     }
   };
  
    const handleCopyIntakeLink = async () => {
      const url = getIntakeUrl();
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        setIntakeCopied(true);
        toast.success("Client intake link copied to clipboard");
        setTimeout(() => setIntakeCopied(false), 2000);
      } catch {
        toast.error("Failed to copy link");
      }
    };
  
    const handleCreateIntakeLink = () => {
      createToken.mutate(clientId || undefined);
    };
 
  const handleAddLink = () => {
    if (!title.trim() || !url.trim()) return;

    addResource.mutate(
      {
        resource_type: "google_drive",
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setUrl("");
          setDescription("");
          setIsDialogOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {/* Client Intake Link Section */}
       {isAdminOrStaff && (
         <Card className="border-primary/20 bg-primary/5">
           <CardContent className="p-4">
             <div className="flex items-start justify-between gap-4">
               <div className="flex items-start gap-3">
                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                   <Sparkles className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <h4 className="font-medium">Client Intake Portal</h4>
                   <p className="text-sm text-muted-foreground mt-0.5">
                     {intakeToken 
                       ? isCompleted 
                         ? `Completed • ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''} uploaded`
                         : "Share this link with your client to collect brand assets"
                       : "Generate a secure link for your client to submit brand assets"}
                   </p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {intakeToken ? (
                   <>
                     {isCompleted ? (
                       <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                         Completed
                       </Badge>
                     ) : (
                       <>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={handleCopyIntakeLink}
                           className="gap-2"
                         >
                           {intakeCopied ? (
                             <>
                               <Check className="h-4 w-4 text-primary" />
                               Copied!
                             </>
                           ) : (
                             <>
                               <Link2 className="h-4 w-4" />
                               Copy Link
                             </>
                           )}
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => regenerateToken.mutate()}
                           disabled={regenerateToken.isPending}
                           title="Regenerate link"
                         >
                           <RefreshCw className={`h-4 w-4 ${regenerateToken.isPending ? 'animate-spin' : ''}`} />
                         </Button>
                       </>
                     )}
                   </>
                 ) : (
                   <Button
                     size="sm"
                     onClick={handleCreateIntakeLink}
                     disabled={createToken.isPending}
                     className="gap-2"
                   >
                     <Link2 className="h-4 w-4" />
                     Generate Intake Link
                   </Button>
                 )}
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Resources</h3>
          <p className="text-sm text-muted-foreground">
            Quick access to Google Drive folders and shared resources
          </p>
        </div>
         <div className="flex items-center gap-2">
           {/* Copy Upload Link for Client Assets */}
           {isAdminOrStaff && uploadFolderUrl && (
             <Button
               variant="outline"
               size="sm"
               className="gap-2"
               onClick={handleCopyUploadLink}
             >
               {copied ? (
                 <>
                   <Check className="h-4 w-4 text-primary" />
                   Copied!
                 </>
               ) : (
                 <>
                   <Upload className="h-4 w-4" />
                   Copy Upload Link
                 </>
               )}
             </Button>
           )}
           {isAdminOrStaff && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Resource Link</DialogTitle>
                <DialogDescription>
                  Add a Google Drive folder or other resource link for easy access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Brand Assets Folder"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's in this folder..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLink} disabled={addResource.isPending}>
                  {addResource.isPending ? "Adding..." : "Add Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
           )}
         </div>
      </div>

      {/* Resource Links */}
      {driveLinks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Folder className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium">No resources yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdminOrStaff
                ? "Add a Google Drive folder or resource link"
                : "Shared resources will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {driveLinks.map((link, index) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium leading-tight">{link.title}</h4>
                        {link.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                    {isAdminOrStaff && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeResource.mutate(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
