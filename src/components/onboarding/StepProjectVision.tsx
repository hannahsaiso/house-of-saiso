import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "./ServiceCard";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { OnboardingFormData } from "@/pages/Onboarding";

interface StepProjectVisionProps {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

const services = [
  {
    id: "content-creation",
    label: "Content Creation",
    description: "Photography, video production, and creative assets",
  },
  {
    id: "social-media",
    label: "Social Media Management",
    description: "Strategy, scheduling, and community engagement",
  },
  {
    id: "seo-analytics",
    label: "SEO & Analytics",
    description: "Search optimization and performance tracking",
  },
  {
    id: "studio-rental",
    label: "Studio Rental",
    description: "Professional studio space for shoots and events",
  },
  {
    id: "brand-strategy",
    label: "Brand Strategy",
    description: "Identity development and positioning",
  },
  {
    id: "video-production",
    label: "Video Production",
    description: "Full-service video from concept to delivery",
  },
];

export function StepProjectVision({
  register,
  watch,
  setValue,
  errors,
}: StepProjectVisionProps) {
  const selectedServices = watch("servicesNeeded") || [];

  const toggleService = (serviceId: string) => {
    const current = selectedServices;
    const updated = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];
    setValue("servicesNeeded", updated, { shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-3xl md:text-4xl text-foreground leading-tight"
      >
        What's your vision?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="projectGoals" className="text-sm tracking-wide">
          Project Goals
        </Label>
        <Textarea
          id="projectGoals"
          {...register("projectGoals")}
          placeholder="Tell us about your project vision, goals, and what success looks like for you. The more context you provide, the better we can tailor our approach..."
          className="mt-2 min-h-[160px] resize-none"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div>
          <p className="text-sm tracking-wide text-foreground">
            Services Needed
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Select all that apply
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <ServiceCard
                label={service.label}
                description={service.description}
                selected={selectedServices.includes(service.id)}
                onToggle={() => toggleService(service.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
