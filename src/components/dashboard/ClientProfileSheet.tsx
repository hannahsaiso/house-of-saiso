import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  FolderOpen,
  ListTodo,
  ExternalLink,
} from "lucide-react";
import type { OnboardingSubmission } from "@/hooks/useRecentOnboardings";

interface ClientProfileSheetProps {
  submission: OnboardingSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTaskSetup: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;

  const content = (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
      {href && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-colors hover:bg-accent/50 rounded-md -mx-2 px-2"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function ClientProfileSheet({
  submission,
  open,
  onOpenChange,
  onStartTaskSetup,
}: ClientProfileSheetProps) {
  if (!submission) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="font-heading text-xl">
                {submission.company || "Unnamed Company"}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {submission.contactName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contact Details
            </h3>
            <div className="rounded-lg border border-border/50 bg-card/30 px-4">
              <InfoRow icon={Mail} label="Email" value={submission.email} />
              <InfoRow icon={Phone} label="Phone" value={submission.phone} />
              <InfoRow
                icon={Globe}
                label="Website"
                value={submission.websiteUrl}
                href={submission.websiteUrl || undefined}
              />
              <InfoRow
                icon={Instagram}
                label="Instagram"
                value={submission.instagramHandle}
                href={
                  submission.instagramHandle
                    ? `https://instagram.com/${submission.instagramHandle.replace("@", "")}`
                    : undefined
                }
              />
              <InfoRow
                icon={Linkedin}
                label="LinkedIn"
                value={submission.linkedinUrl}
                href={submission.linkedinUrl || undefined}
              />
            </div>
          </section>

          <Separator />

          {/* Services Needed */}
          {submission.servicesNeeded && submission.servicesNeeded.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Services Requested
              </h3>
              <div className="flex flex-wrap gap-2">
                {submission.servicesNeeded.map((service) => (
                  <Badge
                    key={service}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Project Vision */}
          {submission.projectGoals && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Project Vision
              </h3>
              <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                <p className="text-sm leading-relaxed italic text-muted-foreground">
                  "{submission.projectGoals}"
                </p>
              </div>
            </section>
          )}

          {/* Brand Assets */}
          {submission.brandAssetsFolder && (
            <section>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Brand Assets
              </h3>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-4">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Assets uploaded</span>
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Internal Notes
            </h3>
            <Textarea
              placeholder="Add notes about this client..."
              defaultValue={submission.notes || ""}
              className="min-h-[100px] resize-none"
            />
          </section>

          {/* Action Button */}
          <Button
            onClick={onStartTaskSetup}
            className="w-full gap-2"
            size="lg"
          >
            <ListTodo className="h-4 w-4" />
            Create First Task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
