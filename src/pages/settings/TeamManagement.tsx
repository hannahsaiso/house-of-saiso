import { motion } from "framer-motion";
import { Mail, Clock, X, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamInvites } from "@/hooks/useTeamInvites";
import { formatDistanceToNow } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { InviteMemberDialog } from "@/components/settings/team/InviteMemberDialog";
import { TeamUsersTable } from "@/components/settings/team/TeamUsersTable";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { toast } from "sonner";

export default function TeamManagement() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { invites, isLoading: invitesLoading, sendInvite, revokeInvite } = useTeamInvites();
  const { teamMembers, isLoading: membersLoading, updateTeamMemberRole } = useTeamMembers();
  const { users, isLoading: usersLoading, setUserRole } = useRoleManagement();

  const isLoading = roleLoading || invitesLoading || membersLoading || usersLoading;

  const copyInviteLink = async (token: string, inviteId: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/join?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedId(inviteId);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Team Management</h1>
          <p className="mt-2 text-muted-foreground">
            Invite and manage team members, set roles and permissions.
          </p>
        </div>

        {isAdmin && (
          <InviteMemberDialog
            isInviting={sendInvite.isPending}
            onInvite={async ({ email, role }) => {
              const result = await sendInvite.mutateAsync({ email, role });
              return result ? { token: result.token, email: result.email } : null;
            }}
          />
        )}
      </div>

      {!isAdmin ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You don't have access to Team Management.
          </CardContent>
        </Card>
      ) : (
        <>
          <TeamUsersTable
            users={users}
            pending={teamMembers}
            isLoading={isLoading}
            onChangeActiveUserRole={({ userId, role }) => setUserRole.mutate({ userId, role })}
            onChangePendingRole={({ email, role }) => updateTeamMemberRole.mutate({ email, role })}
          />

          {/* Pending Invites (audit trail) */}
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
                <p className="py-8 text-center text-muted-foreground">No pending invitations.</p>
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
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invite.token, invite.id)}
                          className="gap-1.5"
                        >
                          {copiedId === invite.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Link
                            </>
                          )}
                        </Button>
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
        </>
      )}
    </motion.div>
  );
}
