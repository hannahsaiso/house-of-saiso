import { useState } from "react";
import { UserPlus, Loader2, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InviteResult {
  token: string;
  email: string;
}

export function InviteMemberDialog({
  onInvite,
  isInviting,
}: {
  onInvite: (payload: { email: string; role: "staff" | "admin" }) => Promise<InviteResult | null>;
  isInviting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    const result = await onInvite({ email: email.trim(), role });
    if (result?.token) {
      const link = `${window.location.origin}/join?token=${result.token}`;
      setInviteLink(link);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setEmail("");
      setRole("staff");
      setInviteLink(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Invite Team Member</DialogTitle>
          <DialogDescription>
            {inviteLink
              ? "Invite created! Share the link below with your team member."
              : "Sends an invitation and creates a pending team member in the database."}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Link className="h-4 w-4" />
                Invite Link Ready
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with <span className="font-medium text-foreground">{email}</span> so they can create their account:
              </p>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono bg-background"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
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
            <p className="text-xs text-muted-foreground text-center">
              The link expires in 7 days. They'll set their password and automatically get <span className="capitalize font-medium">{role}</span> access.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "staff" | "admin")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Staff can manage projects and bookings. Admins have full access including financials.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {inviteLink ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex-1 gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button onClick={() => handleClose(false)} className="flex-1">
                Done
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!email.trim() || isInviting}>
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
