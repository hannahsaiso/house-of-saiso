import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaffProfiles, StaffProfile } from "@/hooks/useStaffProfiles";
import { StaffProfileCard } from "./StaffProfileCard";
import { AddStaffDialog } from "./AddStaffDialog";

export function TeamTab() {
  const { profiles, isLoading } = useStaffProfiles();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--vault-accent))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold text-[hsl(var(--vault-foreground))]">
            Team Members
          </h3>
          <p className="text-sm text-[hsl(var(--vault-muted))]">
            Manage staff profiles, contracts, and performance notes
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSelectedProfile(null);
            setIsAddDialogOpen(true);
          }}
          className="gap-2 bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))] hover:bg-[hsl(var(--vault-accent))]/90"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--vault-border))] p-12 text-center">
          <p className="text-[hsl(var(--vault-muted))]">
            No team members yet. Click "Add Member" to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {profiles.map((profile) => (
            <StaffProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => {
                setSelectedProfile(profile);
                setIsAddDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <AddStaffDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        profile={selectedProfile}
      />
    </div>
  );
}
