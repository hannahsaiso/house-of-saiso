import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, Users } from "lucide-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { OnboardingFormData } from "@/pages/Onboarding";

interface StepGoalsKPIsProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.4 },
});

export function StepGoalsKPIs({ register, errors }: StepGoalsKPIsProps) {
  return (
    <div className="space-y-8">
      <motion.div {...anim(0)}>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
          Goals & KPIs
        </h1>
        <p className="text-muted-foreground mt-2">
          Define what success looks like so we can align every effort with your outcomes.
        </p>
      </motion.div>

      {/* North Star */}
      <motion.div {...anim(1)} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <Label htmlFor="northStarGoal" className="text-sm tracking-wide font-medium">
            The North Star Goal
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          What is the one number or outcome that makes the next 6 months a win?
        </p>
        <Textarea
          id="northStarGoal"
          {...register("northStarGoal")}
          placeholder="e.g., 'Grow monthly qualified leads from 50 to 200' or 'Launch our DTC brand with 1,000 pre-orders'"
          className="min-h-[100px] resize-none"
        />
      </motion.div>

      {/* Current Benchmarks */}
      <motion.div {...anim(2)} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <Label htmlFor="currentBenchmarks" className="text-sm tracking-wide font-medium">
            Current Benchmarks
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          What are your current monthly leads, engagement rates, traffic, or revenue?
        </p>
        <Textarea
          id="currentBenchmarks"
          {...register("currentBenchmarks")}
          placeholder="e.g., '~2,000 monthly website visits, 1.2% engagement on Instagram, 30 leads/month'"
          className="min-h-[100px] resize-none"
        />
      </motion.div>

      {/* Audience Pain Points */}
      <motion.div {...anim(3)} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <Label htmlFor="audiencePainPoints" className="text-sm tracking-wide font-medium">
            Target Audience Pain Points
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          What keeps your customers awake at night? What frustrations drive them to seek your solution?
        </p>
        <Textarea
          id="audiencePainPoints"
          {...register("audiencePainPoints")}
          placeholder="e.g., 'They're overwhelmed by choice and don't trust generic marketing advice. They need a partner who understands their niche...'"
          className="min-h-[120px] resize-none"
        />
      </motion.div>
    </div>
  );
}
