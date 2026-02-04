import { useState, useEffect, useCallback } from "react";
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
import { SuccessAnimation } from "@/components/ui/success-animation";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
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
  // Step 1
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  linkedin: string;
  website: string;
  // Step 2
  projectGoals: string;
  servicesNeeded: string[];
  // Step 3
  brandAssets: UploadedFile[];
  // Step 4
  termsAccepted: boolean;
  finalNotes: string;
}

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [clientId] = useState(() => crypto.randomUUID());

  const {
    initialStep,
    initialData,
    loading: draftLoading,
    saving,
    lastSaved,
    saveDraft,
    saveImmediately,
    deleteDraft,
  } = useOnboardingDraft();

  const { uploadFile } = useFileUpload(clientId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty },
    reset,
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

  // Load draft data
  useEffect(() => {
    if (!draftLoading && initialData && Object.keys(initialData).length > 0) {
      // Merge with defaults to ensure all fields exist
      const mergedData = {
        companyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        instagram: "",
        linkedin: "",
        website: "",
        projectGoals: "",
        servicesNeeded: [] as string[],
        brandAssets: [] as UploadedFile[],
        termsAccepted: false,
        finalNotes: "",
        ...initialData,
      } as OnboardingFormData;
      reset(mergedData);
      setCurrentStep(initialStep);
    }
  }, [draftLoading, initialData, initialStep, reset]);

  // Auto-save on form changes
  const formData = watch();
  useEffect(() => {
    if (isDirty && !draftLoading) {
      // Convert to plain object for JSON serialization
      const dataToSave = JSON.parse(JSON.stringify(formData));
      saveDraft(currentStep, dataToSave);
    }
  }, [formData, currentStep, isDirty, draftLoading, saveDraft]);

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

    // Save immediately before moving to next step
    const dataToSave = JSON.parse(JSON.stringify(formData));
    await saveImmediately(currentStep, dataToSave);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to complete onboarding.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Create client record
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: data.contactName,
          company: data.companyName,
          email: data.contactEmail,
          phone: data.contactPhone || null,
          instagram_handle: data.instagram || null,
          linkedin_url: data.linkedin || null,
          website_url: data.website || null,
          project_goals: data.projectGoals || null,
          services_needed: data.servicesNeeded,
          brand_assets_folder: `client-assets/${clientId}`,
          notes: data.finalNotes || null,
          created_by: user.id,
          onboarded_by: user.id,
          onboarded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create initial project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: `${data.companyName} - Initial Project`,
          description: data.projectGoals || null,
          client_id: client.id,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add user as project member
      await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role: "collaborator",
      });

      // Create notifications for Admin/Staff
      const { data: adminStaff } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "staff"]);

      if (adminStaff && adminStaff.length > 0) {
        const notifications = adminStaff.map((role) => ({
          user_id: role.user_id,
          type: "client_onboarded",
          title: "New Client Onboarded",
          message: `${data.companyName} has completed their onboarding.`,
          data: { client_id: client.id, project_id: project.id },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Delete the draft
      await deleteDraft();

      // Show success animation
      setShowSuccess(true);
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

  if (draftLoading) {
    return (
      <OnboardingLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </OnboardingLayout>
    );
  }

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <OnboardingLayout>
      <SuccessAnimation
        show={showSuccess}
        message="Welcome to House of Saiso!"
        onComplete={() => navigate("/")}
      />
      
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

        {/* Navigation - Mobile optimized */}
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

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Save indicator - Hidden on mobile, show at top on desktop */}
            <span className="hidden text-xs text-muted-foreground sm:block">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              ) : null}
            </span>

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
