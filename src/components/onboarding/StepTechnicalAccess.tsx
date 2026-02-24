import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "./FileDropzone";
import { ServiceCard } from "./ServiceCard";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { OnboardingFormData, UploadedFile } from "@/pages/Onboarding";

interface StepTechnicalAccessProps {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  onUploadFile: (file: File) => Promise<UploadedFile | null>;
}

const accessItems = [
  { id: "google-analytics", label: "Google Analytics", description: "GA4 property access" },
  { id: "meta-ads", label: "Meta Ads Manager", description: "Facebook & Instagram ad accounts" },
  { id: "google-ads", label: "Google Ads", description: "Search & display campaigns" },
  { id: "cms", label: "CMS / Shopify", description: "Website content management" },
  { id: "tiktok-ads", label: "TikTok Ads", description: "TikTok ad account access" },
  { id: "email-platform", label: "Email Platform", description: "Mailchimp, Klaviyo, etc." },
];

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.4 },
});

export function StepTechnicalAccess({
  register,
  watch,
  setValue,
  errors,
  onUploadFile,
}: StepTechnicalAccessProps) {
  const logoFiles = watch("logoFiles") || [];
  const typographyFiles = watch("typographyFiles") || [];
  const accessGranted = watch("accessGranted") || [];

  const toggleAccess = (id: string) => {
    const updated = accessGranted.includes(id)
      ? accessGranted.filter((a) => a !== id)
      : [...accessGranted, id];
    setValue("accessGranted", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <motion.div {...anim(0)}>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
          Technical Access & Assets
        </h1>
        <p className="text-muted-foreground mt-2">
          Share your creative assets and grant access to accounts so we can hit the ground running.
        </p>
      </motion.div>

      {/* Logos */}
      <motion.div {...anim(1)} className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Logo Files</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vector formats preferred (.AI, .EPS, .SVG) + transparent PNGs
          </p>
        </div>
        <FileDropzone
          files={logoFiles}
          onFilesChange={(files) => setValue("logoFiles", files, { shouldDirty: true })}
          onUpload={onUploadFile}
          accept=".svg,.eps,.ai,.png,.pdf,image/*"
          maxFiles={10}
        />
      </motion.div>

      {/* Typography */}
      <motion.div {...anim(2)} className="space-y-3 pt-4 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Typography</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Font names and/or upload .OTF / .TTF files
          </p>
        </div>
        <div>
          <Label htmlFor="typographyNames" className="text-sm">Font Names</Label>
          <Input
            id="typographyNames"
            {...register("typographyNames")}
            placeholder="e.g., Playfair Display, Inter"
            className="mt-1.5"
          />
        </div>
        <FileDropzone
          files={typographyFiles}
          onFilesChange={(files) => setValue("typographyFiles", files, { shouldDirty: true })}
          onUpload={onUploadFile}
          accept=".otf,.ttf,.woff,.woff2"
          maxFiles={10}
        />
      </motion.div>

      {/* Media Kit */}
      <motion.div {...anim(3)} className="space-y-2 pt-4 border-t border-border">
        <Label htmlFor="mediaKitLink" className="text-sm font-medium">
          Media Kit / Photography & B-Roll
        </Label>
        <p className="text-xs text-muted-foreground">
          Paste a Google Drive or Dropbox link to your existing media assets
        </p>
        <Input
          id="mediaKitLink"
          {...register("mediaKitLink")}
          placeholder="https://drive.google.com/..."
          className="mt-1.5"
        />
      </motion.div>

      {/* Access Checklist */}
      <motion.div {...anim(4)} className="space-y-4 pt-4 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Access Checklist</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select all platforms you have granted or will grant us access to
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {accessItems.map((item) => (
            <ServiceCard
              key={item.id}
              label={item.label}
              description={item.description}
              selected={accessGranted.includes(item.id)}
              onToggle={() => toggleAccess(item.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Budget */}
      <motion.div {...anim(5)} className="space-y-2 pt-4 border-t border-border">
        <Label htmlFor="budgetRange" className="text-sm font-medium">
          Budget Confirmation
        </Label>
        <p className="text-xs text-muted-foreground">
          Monthly ad spend and/or total project budget range
        </p>
        <Input
          id="budgetRange"
          {...register("budgetRange")}
          placeholder="e.g., $5,000/month ad spend + $15,000 project fee"
          className="mt-1.5"
        />
      </motion.div>

      {/* Final Notes */}
      <motion.div {...anim(6)} className="space-y-2 pt-4 border-t border-border">
        <Label htmlFor="finalNotes" className="text-sm font-medium">
          Is there anything we haven't asked that you think is vital for us to know?
        </Label>
        <Textarea
          id="finalNotes"
          {...register("finalNotes")}
          placeholder="Share anything else — timelines, special requirements, your wildest ideas..."
          className="min-h-[120px] resize-none"
        />
      </motion.div>
    </div>
  );
}
