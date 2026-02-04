import { useState } from "react";
import { format } from "date-fns";
import { Mail, Phone, FileText, Plus, ExternalLink, Upload, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffProfile, useStaffProfiles } from "@/hooks/useStaffProfiles";
import { usePerformanceLogs } from "@/hooks/usePerformanceLogs";
import { PerformanceLog } from "./PerformanceLog";
import { AddPerformanceNote } from "./AddPerformanceNote";

interface StaffProfileCardProps {
  profile: StaffProfile;
  onEdit: () => void;
}

export function StaffProfileCard({ profile, onEdit }: StaffProfileCardProps) {
  const { uploadContract, getContractUrl } = useStaffProfiles();
  const { logs, addLog, isLoading: logsLoading } = usePerformanceLogs(profile.id);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadContract.mutateAsync({ staffId: profile.id, file });
    }
  };

  const handleViewContract = async () => {
    if (profile.contract_file_path) {
      const url = await getContractUrl(profile.contract_file_path);
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[hsl(var(--vault-border))] p-6">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-heading text-xl font-semibold text-[hsl(var(--vault-foreground))]">
              {profile.full_name}
            </h4>
            {profile.role && (
              <span className="rounded-full bg-[hsl(var(--vault-accent))]/20 px-3 py-1 text-xs font-medium text-[hsl(var(--vault-accent))]">
                {profile.role}
              </span>
            )}
          </div>
          {profile.hire_date && (
            <p className="mt-1 text-sm text-[hsl(var(--vault-muted))]">
              Hired {format(new Date(profile.hire_date), "MMMM yyyy")}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-[hsl(var(--vault-muted))] hover:text-[hsl(var(--vault-foreground))]"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 border-b border-[hsl(var(--vault-border))] p-6 md:grid-cols-2">
        {profile.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-[hsl(var(--vault-muted))]" />
            <a
              href={`mailto:${profile.email}`}
              className="text-[hsl(var(--vault-foreground))] hover:text-[hsl(var(--vault-accent))]"
            >
              {profile.email}
            </a>
          </div>
        )}
        {profile.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-[hsl(var(--vault-muted))]" />
            <span className="text-[hsl(var(--vault-foreground))]">{profile.phone}</span>
          </div>
        )}
      </div>

      {/* Contract Section */}
      <div className="border-b border-[hsl(var(--vault-border))] p-6">
        <h5 className="mb-4 text-xs font-medium uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
          Contract
        </h5>
        <div className="flex items-center gap-3">
          {profile.contract_file_path ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewContract}
                className="gap-2 border-[hsl(var(--vault-border))] text-[hsl(var(--vault-foreground))]"
              >
                <FileText className="h-4 w-4" />
                View Contract
                <ExternalLink className="h-3 w-3" />
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleContractUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-[hsl(var(--vault-muted))]"
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>
            </>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleContractUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 border-dashed border-[hsl(var(--vault-border))] text-[hsl(var(--vault-muted))]"
              >
                <span>
                  <Upload className="h-4 w-4" />
                  Upload Contract
                </span>
              </Button>
            </label>
          )}
        </div>
      </div>

      {/* Performance Log */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="text-xs font-medium uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
            Performance Log
          </h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNoteDialogOpen(true)}
            className="gap-2 text-[hsl(var(--vault-accent))]"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>

        <PerformanceLog logs={logs} isLoading={logsLoading} />
      </div>

      <AddPerformanceNote
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        staffId={profile.id}
        onSubmit={(note) => addLog.mutateAsync({ staffId: profile.id, note })}
      />
    </div>
  );
}
