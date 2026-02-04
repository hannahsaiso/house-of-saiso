import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTeamInvites } from "@/hooks/useTeamInvites";
import { useStaffProfiles } from "@/hooks/useStaffProfiles";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeamManagement() {
  const { invites, isLoading: invitesLoading, sendInvite, revokeInvite } = useTeamInvites();
  const { profiles, isLoading: profilesLoading } = useStaffProfiles();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "admin">("staff");

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    await sendInvite.mutateAsync({ email: inviteEmail, role: inviteRole });
    setInviteEmail("");
    setIsInviteDialogOpen(false);
  };

  const isLoading = invitesLoading || profilesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Team Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Invite and manage team members, set roles and permissions.
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
                Send an invitation email to add a new team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "staff" | "admin")}>
                  <SelectTrigger>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={!inviteEmail || sendInvite.isPending}>
                {sendInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>Team Members</span>
            <Badge variant="secondary" className="ml-2">
              {profiles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No team members yet. Send an invite to get started.
            </p>
          ) : (
            <div className="divide-y">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {profile.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {profile.role || "Staff"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Pending Invitations
            {invites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invites.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No pending invitations.
            </p>
          ) : (
            <div className="divide-y">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {invite.invited_role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeInvite.mutate(invite.id)}
                      disabled={revokeInvite.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
