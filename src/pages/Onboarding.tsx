import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { StepLogistics } from "@/components/onboarding/StepLogistics";
import { StepBrandDNA } from "@/components/onboarding/StepBrandDNA";
import { StepGoalsKPIs } from "@/components/onboarding/StepGoalsKPIs";
import { StepTechnicalAccess } from "@/components/onboarding/StepTechnicalAccess";
import { useFileUpload } from "@/hooks/useFileUpload";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  path?: string;
  uploading?: boolean;
}

export interface OnboardingFormData {
  // Step 1 — Logistics & Basics
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  preferredChannel: string;
  billingContactName: string;
  billingContactEmail: string;
  websiteUrl: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
  facebook: string;

  // Step 2 — Brand DNA & Voice
  brandMission: string;
  toneOfVoice: string[];
  nonNegotiables: string;
  hasBrandGuidelines: boolean;
  brandGuidelineFiles: UploadedFile[];
  primaryHexCodes: string;

  // Step 3 — Goals & KPIs
  northStarGoal: string;
  currentBenchmarks: string;
  audiencePainPoints: string;

  // Step 4 — Technical Access & Assets
  logoFiles: UploadedFile[];
  typographyNames: string;
  typographyFiles: UploadedFile[];
  mediaKitLink: string;
  accessGranted: string[];
  budgetRange: string;

  // Conclusion
  finalNotes: string;
}

const TOTAL_STEPS = 4;
const DRAFT_KEY = "onboarding_draft";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId] = useState(() => crypto.randomUUID());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { uploadFile } = useFileUpload(clientId);

  // Load saved draft from localStorage
  const loadDraft = (): Partial<OnboardingFormData> & { _step?: number } => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  };

  const savedDraft = loadDraft();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      contactName: savedDraft.contactName || "",
      contactRole: savedDraft.contactRole || "",
      contactEmail: savedDraft.contactEmail || "",
      contactPhone: savedDraft.contactPhone || "",
      preferredChannel: savedDraft.preferredChannel || "",
      billingContactName: savedDraft.billingContactName || "",
      billingContactEmail: savedDraft.billingContactEmail || "",
      websiteUrl: savedDraft.websiteUrl || "",
      instagram: savedDraft.instagram || "",
      linkedin: savedDraft.linkedin || "",
      tiktok: savedDraft.tiktok || "",
      facebook: savedDraft.facebook || "",
      brandMission: savedDraft.brandMission || "",
      toneOfVoice: savedDraft.toneOfVoice || [],
      nonNegotiables: savedDraft.nonNegotiables || "",
      hasBrandGuidelines: savedDraft.hasBrandGuidelines ?? true,
      brandGuidelineFiles: savedDraft.brandGuidelineFiles || [],
      primaryHexCodes: savedDraft.primaryHexCodes || "",
      northStarGoal: savedDraft.northStarGoal || "",
      currentBenchmarks: savedDraft.currentBenchmarks || "",
      audiencePainPoints: savedDraft.audiencePainPoints || "",
      logoFiles: savedDraft.logoFiles || [],
      typographyNames: savedDraft.typographyNames || "",
      typographyFiles: savedDraft.typographyFiles || [],
      mediaKitLink: savedDraft.mediaKitLink || "",
      accessGranted: savedDraft.accessGranted || [],
      budgetRange: savedDraft.budgetRange || "",
      finalNotes: savedDraft.finalNotes || "",
    },
  });

  // Restore saved step
  useEffect(() => {
    if (savedDraft._step && savedDraft._step >= 1 && savedDraft._step <= TOTAL_STEPS) {
      setCurrentStep(savedDraft._step);
    }
  }, []);

  // Auto-save on step change
  const saveDraft = useCallback(() => {
    const data = getValues();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, _step: currentStep }));
    setLastSaved(new Date());
  }, [getValues, currentStep]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 1500);
    return () => clearTimeout(timer);
  }, [currentStep, saveDraft]);

  // Watch all form changes for auto-save
  useEffect(() => {
    const sub = watch(() => {
      const timer = setTimeout(saveDraft, 2000);
      return () => clearTimeout(timer);
    });
    return () => sub.unsubscribe();
  }, [watch, saveDraft]);

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return await trigger(["contactName", "contactEmail"]);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    saveDraft();
    if (currentStep < TOTAL_STEPS) setCurrentStep((p) => p + 1);
  };

  const handleBack = () => {
    saveDraft();
    if (currentStep > 1) setCurrentStep((p) => p - 1);
  };

  const handleComplete = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("submit-onboarding", {
        body: {
          companyName: data.contactName,
          contactName: data.contactName,
          contactRole: data.contactRole,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          preferredChannel: data.preferredChannel,
          billingContactName: data.billingContactName,
          billingContactEmail: data.billingContactEmail,
          websiteUrl: data.websiteUrl,
          instagram: data.instagram,
          linkedin: data.linkedin,
          tiktok: data.tiktok,
          facebook: data.facebook,
          brandMission: data.brandMission,
          toneOfVoice: data.toneOfVoice,
          nonNegotiables: data.nonNegotiables,
          hasBrandGuidelines: data.hasBrandGuidelines,
          primaryHexCodes: data.primaryHexCodes,
          northStarGoal: data.northStarGoal,
          currentBenchmarks: data.currentBenchmarks,
          audiencePainPoints: data.audiencePainPoints,
          typographyNames: data.typographyNames,
          mediaKitLink: data.mediaKitLink,
          accessGranted: data.accessGranted,
          budgetRange: data.budgetRange,
          brandAssetsFolder: `client-assets/${clientId}`,
          finalNotes: data.finalNotes,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      navigate("/thank-you");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFile = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      return await uploadFile(file);
    },
    [uploadFile]
  );

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Save indicator */}
      {lastSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6"
        >
          <Save className="w-3 h-3" />
          Draft saved {lastSaved.toLocaleTimeString()}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(handleComplete)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <StepLogistics register={register} errors={errors} watch={watch} setValue={setValue} />
            )}
            {currentStep === 2 && (
              <StepBrandDNA
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                onUploadFile={handleUploadFile}
              />
            )}
            {currentStep === 3 && (
              <StepGoalsKPIs register={register} errors={errors} />
            )}
            {currentStep === 4 && (
              <StepTechnicalAccess
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                onUploadFile={handleUploadFile}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col-reverse gap-4 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-stretch sm:items-center">
            {currentStep < TOTAL_STEPS ? (
              <Button type="button" onClick={handleNext} className="w-full gap-2 sm:w-auto">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Onboarding
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </OnboardingLayout>
  );
}
