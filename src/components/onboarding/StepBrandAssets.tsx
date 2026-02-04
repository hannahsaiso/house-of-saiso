import { motion } from "framer-motion";
import { FileDropzone } from "./FileDropzone";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { OnboardingFormData, UploadedFile } from "@/pages/Onboarding";

interface StepBrandAssetsProps {
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  onUploadFile: (file: File) => Promise<UploadedFile | null>;
}

export function StepBrandAssets({
  watch,
  setValue,
  onUploadFile,
}: StepBrandAssetsProps) {
  const files = watch("brandAssets") || [];

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setValue("brandAssets", newFiles, { shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
          Share your brand world...
        </h1>
        <p className="text-muted-foreground mt-3">
          Upload your logos, brand guidelines, mood boards, and any visual
          references that help us understand your aesthetic.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          onUpload={onUploadFile}
          accept="image/*,.pdf"
          maxFiles={10}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4"
      >
        <p className="font-medium text-foreground mb-1">What to include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Logo files (PNG, SVG, or PDF)</li>
          <li>Brand guidelines or style guides</li>
          <li>Mood board images or inspiration</li>
          <li>Color palette references</li>
          <li>Previous campaign materials</li>
        </ul>
      </motion.div>
    </div>
  );
}
