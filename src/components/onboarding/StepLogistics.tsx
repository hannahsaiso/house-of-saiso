import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { OnboardingFormData } from "@/pages/Onboarding";

interface StepLogisticsProps {
  register: UseFormRegister<OnboardingFormData>;
  watch: UseFormWatch<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.4 },
});

export function StepLogistics({ register, watch, setValue, errors }: StepLogisticsProps) {
  return (
    <div className="space-y-8">
      <motion.div {...anim(0)}>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
          Logistics & Basics
        </h1>
        <p className="text-muted-foreground mt-2">
          Let's start with the essentials so we know who to talk to and where to find you.
        </p>
      </motion.div>

      {/* Primary Contact */}
      <motion.div {...anim(1)} className="space-y-4">
        <p className="text-sm tracking-wide uppercase text-muted-foreground font-medium">
          Primary Point of Contact
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contactName" className="text-sm">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactName"
              {...register("contactName", { required: "Name is required" })}
              placeholder="Jane Smith"
              className="mt-1.5"
            />
            {errors.contactName && (
              <p className="text-sm text-destructive mt-1">{errors.contactName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactRole" className="text-sm">Role / Title</Label>
            <Input id="contactRole" {...register("contactRole")} placeholder="Marketing Director" className="mt-1.5" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contactEmail" className="text-sm">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              {...register("contactEmail", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
              })}
              placeholder="jane@company.com"
              className="mt-1.5"
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contactPhone" className="text-sm">Phone</Label>
            <Input id="contactPhone" type="tel" {...register("contactPhone")} placeholder="+1 (555) 000-0000" className="mt-1.5" />
          </div>
        </div>
      </motion.div>

      {/* Preferred Channel */}
      <motion.div {...anim(2)} className="space-y-2">
        <Label className="text-sm">Preferred Communication Channel</Label>
        <Select
          value={watch("preferredChannel")}
          onValueChange={(v) => setValue("preferredChannel", v, { shouldDirty: true })}
        >
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Select channel..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Billing Contact */}
      <motion.div {...anim(3)} className="space-y-4 pt-4 border-t border-border">
        <p className="text-sm tracking-wide uppercase text-muted-foreground font-medium">
          Billing / Accounting Contact
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="billingContactName" className="text-sm">Name</Label>
            <Input id="billingContactName" {...register("billingContactName")} placeholder="Accounts Payable" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="billingContactEmail" className="text-sm">Email</Label>
            <Input id="billingContactEmail" type="email" {...register("billingContactEmail")} placeholder="billing@company.com" className="mt-1.5" />
          </div>
        </div>
      </motion.div>

      {/* Website & Socials */}
      <motion.div {...anim(4)} className="space-y-4 pt-4 border-t border-border">
        <p className="text-sm tracking-wide uppercase text-muted-foreground font-medium">
          Web & Social Presence
        </p>
        <div>
          <Label htmlFor="websiteUrl" className="text-sm">Current Website URL</Label>
          <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://yourcompany.com" className="mt-1.5" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="instagram" className="text-sm">Instagram</Label>
            <Input id="instagram" {...register("instagram")} placeholder="@handle" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
            <Input id="linkedin" {...register("linkedin")} placeholder="linkedin.com/company/..." className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="tiktok" className="text-sm">TikTok</Label>
            <Input id="tiktok" {...register("tiktok")} placeholder="@handle" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="facebook" className="text-sm">Facebook</Label>
            <Input id="facebook" {...register("facebook")} placeholder="facebook.com/..." className="mt-1.5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
