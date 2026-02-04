import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Plus, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface DesignTabProps {
  projectId: string;
}

export function DesignTab({ projectId }: DesignTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const { canvaEmbeds, addResource, removeResource, isLoading } = useProjectResources(projectId);
  const { isAdminOrStaff } = useUserRole();

  const handleAddEmbed = () => {
    if (!title.trim() || !url.trim()) return;

    // Convert Canva share URL to embed URL
    let embedUrl = url;
    if (url.includes("canva.com") && !url.includes("/embed")) {
      embedUrl = url.replace("/design/", "/design/embed/");
    }

    addResource.mutate(
      {
        resource_type: "canva_embed",
        title: title.trim(),
        url: embedUrl,
      },
      {
        onSuccess: () => {
          setTitle("");
          setUrl("");
          setIsDialogOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Design Assets</h3>
          <p className="text-sm text-muted-foreground">
            View and collaborate on Canva designs
          </p>
        </div>
        {isAdminOrStaff && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Canva Design
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Canva Design</DialogTitle>
                <DialogDescription>
                  Paste a Canva share link to embed the design in this project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Social Media Kit"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Canva Share URL</Label>
                  <Input
                    id="url"
                    placeholder="https://www.canva.com/design/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get the share link from Canva → Share → More → Embed
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmbed} disabled={addResource.isPending}>
                  {addResource.isPending ? "Adding..." : "Add Design"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Canva Embeds */}
      {canvaEmbeds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Palette className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium">No designs yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdminOrStaff
                ? "Add a Canva design to get started"
                : "Design assets will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {canvaEmbeds.map((embed, index) => (
            <motion.div
              key={embed.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">
                    {embed.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(embed.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {isAdminOrStaff && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeResource.mutate(embed.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
                    <iframe
                      src={embed.url}
                      className="h-full w-full"
                      allowFullScreen
                      loading="lazy"
                      title={embed.title}
                    />
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
