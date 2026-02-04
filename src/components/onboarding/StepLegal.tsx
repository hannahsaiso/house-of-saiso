import { motion } from "framer-motion";
import { FileSignature, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { OnboardingFormData } from "@/pages/Onboarding";

interface StepLegalProps {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

export function StepLegal({
  register,
  watch,
  setValue,
  errors,
}: StepLegalProps) {
  const termsAccepted = watch("termsAccepted");

  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-3xl md:text-4xl text-foreground leading-tight"
      >
        Almost there...
      </motion.h1>

      {/* Contract Review Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div>
          <p className="text-sm tracking-wide text-foreground font-medium">
            Contract Review
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please review the service agreement before signing
          </p>
        </div>

        <div className="rounded-lg border bg-muted/20 p-6">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="font-medium text-foreground">
              House of Saiso Service Agreement
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              This agreement outlines the terms and conditions for creative
              services provided by House of Saiso. Services include but are not
              limited to content creation, brand strategy, social media
              management, and studio rental.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Payment terms, deliverable timelines, and project scope will be
              defined in individual project proposals. All work remains the
              intellectual property of House of Saiso until final payment is
              received.
            </p>
            <p className="mt-4 text-xs text-muted-foreground italic">
              Full contract details will be provided via DocuSign for digital
              signature.
            </p>
          </div>
        </div>

        {/* DocuSign Placeholder Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                disabled
              >
                <FileSignature className="w-4 h-4" />
                Sign via DocuSign
                <Info className="w-3 h-3 ml-1 text-muted-foreground" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>DocuSign integration coming soon</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Terms Acceptance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-4 rounded-lg border bg-card"
      >
        <Checkbox
          id="termsAccepted"
          checked={termsAccepted}
          onCheckedChange={(checked) =>
            setValue("termsAccepted", checked as boolean, { shouldDirty: true })
          }
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label
            htmlFor="termsAccepted"
            className="text-sm font-medium cursor-pointer"
          >
            I accept the terms and conditions{" "}
            <span className="text-muted-foreground">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            By checking this box, you agree to our service terms and privacy
            policy.
          </p>
        </div>
      </motion.div>
      {errors.termsAccepted && (
        <p className="text-sm text-destructive">
          {errors.termsAccepted.message}
        </p>
      )}

      {/* Final Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Label htmlFor="finalNotes" className="text-sm tracking-wide">
          Additional Notes{" "}
          <span className="text-muted-foreground/50">(optional)</span>
        </Label>
        <Textarea
          id="finalNotes"
          {...register("finalNotes")}
          placeholder="Anything else we should know? Special requirements, timeline constraints, or other considerations..."
          className="mt-2 min-h-[100px] resize-none"
        />
      </motion.div>
    </div>
  );
}
