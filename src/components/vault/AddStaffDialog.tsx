import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaffProfiles, StaffProfile, CreateStaffProfileData } from "@/hooks/useStaffProfiles";
import { format } from "date-fns";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: StaffProfile | null;
}

export function AddStaffDialog({ open, onOpenChange, profile }: AddStaffDialogProps) {
  const { createProfile, updateProfile } = useStaffProfiles();

  const [formData, setFormData] = useState<CreateStaffProfileData>({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    hire_date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        email: profile.email || "",
        phone: profile.phone || "",
        role: profile.role || "",
        hire_date: profile.hire_date || format(new Date(), "yyyy-MM-dd"),
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        role: "",
        hire_date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile) {
      await updateProfile.mutateAsync({ id: profile.id, ...formData });
    } else {
      await createProfile.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  const isSubmitting = createProfile.isPending || updateProfile.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] text-[hsl(var(--vault-foreground))]">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(var(--vault-foreground))]">
            {profile ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--vault-muted))]">
            {profile ? "Update staff information." : "Add a new team member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
              className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Role</Label>
              <Input
                placeholder="Staff, Contractor..."
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Hire Date</Label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) =>
                  setFormData({ ...formData, hire_date: e.target.value })
                }
                className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))] hover:bg-[hsl(var(--vault-accent))]/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {profile ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
