import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileDropzone } from "./FileDropzone";
import { ServiceCard } from "./ServiceCard";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { OnboardingFormData, UploadedFile } from "@/pages/Onboarding";

interface StepBrandDNAProps {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  onUploadFile: (file: File) => Promise<UploadedFile | null>;
}

const tones = [
  { id: "witty", label: "Witty", description: "Clever and playful" },
  { id: "bold", label: "Bold", description: "Confident and daring" },
  { id: "academic", label: "Academic", description: "Scholarly and precise" },
  { id: "trustworthy", label: "Trustworthy", description: "Reliable and honest" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable" },
  { id: "luxury", label: "Luxury", description: "Premium and refined" },
  { id: "minimalist", label: "Minimalist", description: "Clean and understated" },
  { id: "edgy", label: "Edgy", description: "Provocative and raw" },
];

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.4 },
});

export function StepBrandDNA({ register, watch, setValue, errors, onUploadFile }: StepBrandDNAProps) {
  const selectedTones = watch("toneOfVoice") || [];
  const hasGuidelines = watch("hasBrandGuidelines");
  const guidelineFiles = watch("brandGuidelineFiles") || [];

  const toggleTone = (id: string) => {
    const updated = selectedTones.includes(id)
      ? selectedTones.filter((t) => t !== id)
      : [...selectedTones, id];
    setValue("toneOfVoice", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <motion.div {...anim(0)}>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
          Brand DNA & Voice
        </h1>
        <p className="text-muted-foreground mt-2">
          Help us understand the soul of your brand so every word and pixel feels right.
        </p>
      </motion.div>

      {/* Brand Mission */}
      <motion.div {...anim(1)}>
        <Label htmlFor="brandMission" className="text-sm tracking-wide">
          Brand Mission in One Sentence
        </Label>
        <Textarea
          id="brandMission"
          {...register("brandMission")}
          placeholder="We exist to..."
          className="mt-2 min-h-[100px] resize-none"
        />
      </motion.div>

      {/* Tone of Voice */}
      <motion.div {...anim(2)} className="space-y-4">
        <div>
          <p className="text-sm tracking-wide text-foreground font-medium">Tone of Voice</p>
          <p className="text-sm text-muted-foreground mt-1">Select all that describe your brand</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {tones.map((tone, i) => (
            <motion.div key={tone.id} {...anim(3 + i * 0.3)}>
              <ServiceCard
                label={tone.label}
                description={tone.description}
                selected={selectedTones.includes(tone.id)}
                onToggle={() => toggleTone(tone.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Non-Negotiables */}
      <motion.div {...anim(4)}>
        <Label htmlFor="nonNegotiables" className="text-sm tracking-wide">
          Non-Negotiables
        </Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          Topics, competitors, or phrases we should never mention
        </p>
        <Textarea
          id="nonNegotiables"
          {...register("nonNegotiables")}
          placeholder="e.g., Never mention [competitor]. Avoid [topic]..."
          className="min-h-[80px] resize-none"
        />
      </motion.div>

      {/* Brand Guidelines Toggle */}
      <motion.div {...anim(5)} className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {hasGuidelines
                ? "I have brand guidelines to upload"
                : "I don't have formal guidelines"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasGuidelines
                ? "Upload your brand book or PDF guidelines"
                : "We'll use your website as a reference — share your primary colors below"}
            </p>
          </div>
          <Switch
            checked={hasGuidelines}
            onCheckedChange={(v) => setValue("hasBrandGuidelines", v, { shouldDirty: true })}
          />
        </div>

        {hasGuidelines ? (
          <FileDropzone
            files={guidelineFiles}
            onFilesChange={(files) => setValue("brandGuidelineFiles", files, { shouldDirty: true })}
            onUpload={onUploadFile}
            accept=".pdf,image/*"
            maxFiles={5}
          />
        ) : (
          <div>
            <Label htmlFor="primaryHexCodes" className="text-sm">
              Primary Hex Codes
            </Label>
            <Input
              id="primaryHexCodes"
              {...register("primaryHexCodes")}
              placeholder="#D4AF37, #1A1A1A, #FDFCFB"
              className="mt-1.5"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
