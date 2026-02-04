import { useState } from "react";
import { Copy, Link2, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublicCalendarToken } from "@/hooks/usePublicCalendarToken";
import { toast } from "sonner";
import { format } from "date-fns";

interface ShareCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCalendarDialog({ open, onOpenChange }: ShareCalendarDialogProps) {
  const { tokens, generateToken, revokeToken, getPublicUrl } = usePublicCalendarToken();
  const [expiresInDays, setExpiresInDays] = useState<string>("30");

  const handleGenerate = async () => {
    const days = expiresInDays ? parseInt(expiresInDays) : undefined;
    await generateToken.mutateAsync(days);
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    toast.success("Link copied to clipboard");
  };

  const handleRevoke = async (id: string) => {
    if (confirm("Are you sure you want to revoke this link?")) {
      await revokeToken.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Share Calendar</DialogTitle>
          <DialogDescription>
            Generate a read-only link to share your calendar availability with
            prospective clients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate New Link */}
          <div className="space-y-3">
            <Label>Create New Link</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Days until expiry"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={handleGenerate}
                disabled={generateToken.isPending}
                className="gap-2"
              >
                {generateToken.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <Link2 className="h-4 w-4" />
                Generate Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank for a link that never expires.
            </p>
          </div>

          {/* Existing Links */}
          {tokens.length > 0 && (
            <div className="space-y-3">
              <Label>Active Links</Label>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex-1 truncate text-sm">
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        ...{token.token.slice(-12)}
                      </code>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {format(new Date(token.created_at), "MMM d, yyyy")}
                        {token.expires_at && (
                          <> · Expires {format(new Date(token.expires_at), "MMM d, yyyy")}</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(token.token)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(token.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tokens.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No active share links. Generate one above.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
