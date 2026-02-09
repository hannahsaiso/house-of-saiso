import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRow, AppRole } from "@/hooks/useRoleManagement";
import type { TeamMember } from "@/hooks/useTeamMembers";

type Row =
  | {
      kind: "active";
      key: string;
      email: string;
      name: string | null;
      role: AppRole | null;
      userId: string;
      status: "active";
    }
  | {
      kind: "pending";
      key: string;
      email: string;
      name: null;
      role: "admin" | "staff";
      userId: null;
      status: "pending";
    };

export function TeamUsersTable({
  users,
  pending,
  isLoading,
  onChangeActiveUserRole,
  onChangePendingRole,
  onRemovePendingMember,
}: {
  users: UserRow[];
  pending: TeamMember[];
  isLoading: boolean;
  onChangeActiveUserRole: (payload: { userId: string; role: AppRole }) => void;
  onChangePendingRole: (payload: { email: string; role: "admin" | "staff" }) => void;
  onRemovePendingMember?: (email: string) => void;
}) {
  const rows: Row[] = useMemo(() => {
    const activeRows: Row[] = users.map((u) => ({
      kind: "active",
      key: `active:${u.user_id}`,
      email: u.email,
      name: u.full_name,
      role: u.role,
      userId: u.user_id,
      status: "active",
    }));

    const pendingRows: Row[] = pending
      .filter((m) => m.status === "pending")
      .map((m) => ({
        kind: "pending",
        key: `pending:${m.id}`,
        email: m.email,
        name: null,
        role: (m.invited_role === "admin" ? "admin" : "staff") as "admin" | "staff",
        userId: null,
        status: "pending",
      }));

    // De-dupe: if a user is active, hide any pending row with the same email.
    const activeEmails = new Set(activeRows.map((r) => r.email.toLowerCase()));
    const dedupedPending = pendingRows.filter((r) => !activeEmails.has(r.email.toLowerCase()));

    return [...activeRows, ...dedupedPending];
  }, [users, pending]);

  const handleRemove = (email: string) => {
    if (confirm(`Remove pending invitation for ${email}?`)) {
      onRemovePendingMember?.(email);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Team</span>
          <Badge variant="secondary" className="ml-2">
            {rows.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No users yet.</p>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(row.name || row.email)
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0]?.toUpperCase())
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.name || row.email}</p>
                    <p className="text-sm text-muted-foreground truncate">{row.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={row.status === "pending" ? "outline" : "secondary"}>
                    {row.status}
                  </Badge>

                  {/* Admin-only control should be enforced by page-level gating; this is UI only. */}
                  {row.kind === "active" ? (
                    <Select
                      value={row.role ?? "client"}
                      onValueChange={(v) => onChangeActiveUserRole({ userId: row.userId, role: v as AppRole })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Select
                        value={row.role}
                        onValueChange={(v) => onChangePendingRole({ email: row.email, role: v as "admin" | "staff" })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {onRemovePendingMember && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(row.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
