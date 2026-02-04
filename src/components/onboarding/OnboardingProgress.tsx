import { motion } from "framer-motion";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = ["Basics", "Vision", "Assets", "Legal"];

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm tracking-widest text-muted-foreground uppercase">
          Step {currentStep} of {totalSteps}
        </span>
        <div className="flex gap-4">
          {stepLabels.map((label, index) => (
            <span
              key={label}
              className={`text-xs tracking-wider uppercase transition-colors ${
                index + 1 === currentStep
                  ? "text-foreground font-medium"
                  : index + 1 < currentStep
                  ? "text-primary"
                  : "text-muted-foreground/50"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-0.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
