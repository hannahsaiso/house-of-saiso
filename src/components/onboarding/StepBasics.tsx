import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { OnboardingFormData } from "@/pages/Onboarding";

interface StepBasicsProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export function StepBasics({ register, errors }: StepBasicsProps) {
  return (
    <div className="space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-3xl md:text-4xl text-foreground leading-tight"
      >
        Tell us about your company...
      </motion.h1>

      <div className="space-y-6">
        <motion.div
          custom={0}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
        >
          <Label htmlFor="companyName" className="text-sm tracking-wide">
            Company Name <span className="text-muted-foreground">*</span>
          </Label>
          <Input
            id="companyName"
            {...register("companyName", { required: "Company name is required" })}
            placeholder="Your company name"
            className="mt-2"
          />
          {errors.companyName && (
            <p className="text-sm text-destructive mt-1">
              {errors.companyName.message}
            </p>
          )}
        </motion.div>

        <motion.div
          custom={1}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
        >
          <Label htmlFor="contactName" className="text-sm tracking-wide">
            Key Contact <span className="text-muted-foreground">*</span>
          </Label>
          <Input
            id="contactName"
            {...register("contactName", { required: "Contact name is required" })}
            placeholder="Primary point of contact"
            className="mt-2"
          />
          {errors.contactName && (
            <p className="text-sm text-destructive mt-1">
              {errors.contactName.message}
            </p>
          )}
        </motion.div>

        <motion.div
          custom={2}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
        >
          <Label htmlFor="contactEmail" className="text-sm tracking-wide">
            Email <span className="text-muted-foreground">*</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            {...register("contactEmail", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            })}
            placeholder="contact@company.com"
            className="mt-2"
          />
          {errors.contactEmail && (
            <p className="text-sm text-destructive mt-1">
              {errors.contactEmail.message}
            </p>
          )}
        </motion.div>

        <motion.div
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
        >
          <Label htmlFor="contactPhone" className="text-sm tracking-wide">
            Phone <span className="text-muted-foreground/50">(optional)</span>
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            {...register("contactPhone")}
            placeholder="+1 (555) 000-0000"
            className="mt-2"
          />
        </motion.div>

        <motion.div
          custom={4}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="pt-4 border-t border-border"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Social Presence
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="instagram" className="text-sm">
                Instagram
              </Label>
              <Input
                id="instagram"
                {...register("instagram")}
                placeholder="@handle"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="linkedin" className="text-sm">
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                {...register("linkedin")}
                placeholder="linkedin.com/company/..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-sm">
                Website
              </Label>
              <Input
                id="website"
                {...register("website")}
                placeholder="https://..."
                className="mt-2"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
