import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { StepBasics } from "@/components/onboarding/StepBasics";
import { StepProjectVision } from "@/components/onboarding/StepProjectVision";
import { StepBrandAssets } from "@/components/onboarding/StepBrandAssets";
import { StepLegal } from "@/components/onboarding/StepLegal";
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
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  linkedin: string;
  website: string;
  projectGoals: string;
  servicesNeeded: string[];
  brandAssets: UploadedFile[];
  termsAccepted: boolean;
  finalNotes: string;
}

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId] = useState(() => crypto.randomUUID());

  const { uploadFile } = useFileUpload(clientId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      companyName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      instagram: "",
      linkedin: "",
      website: "",
      projectGoals: "",
      servicesNeeded: [],
      brandAssets: [],
      termsAccepted: false,
      finalNotes: "",
    },
  });

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return await trigger(["companyName", "contactName", "contactEmail"]);
      case 4:
        return await trigger(["termsAccepted"]);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async (data: OnboardingFormData) => {
    if (!data.termsAccepted) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke(
        "submit-onboarding",
        {
          body: {
            companyName: data.companyName,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            instagram: data.instagram,
            linkedin: data.linkedin,
            website: data.website,
            projectGoals: data.projectGoals,
            servicesNeeded: data.servicesNeeded,
            brandAssetsFolder: `client-assets/${clientId}`,
            finalNotes: data.finalNotes,
          },
        }
      );

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Redirect immediately to thank-you page
      navigate("/thank-you");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description:
          error.message || "Failed to complete onboarding. Please try again.",
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
              <StepBasics register={register} errors={errors} />
            )}
            {currentStep === 2 && (
              <StepProjectVision
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            )}
            {currentStep === 3 && (
              <StepBrandAssets
                watch={watch}
                setValue={setValue}
                onUploadFile={handleUploadFile}
              />
            )}
            {currentStep === 4 && (
              <StepLegal
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
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
              <Button
                type="button"
                onClick={handleNext}
                className="w-full gap-2 sm:w-auto"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
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
