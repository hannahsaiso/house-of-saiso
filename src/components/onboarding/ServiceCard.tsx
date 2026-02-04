import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  label: string;
  description: string;
  selected: boolean;
  onToggle: () => void;
}

export function ServiceCard({ label, description, selected, onToggle }: ServiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full p-5 text-left rounded-lg border-2 transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-foreground">{label}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30"
          )}
        >
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </motion.button>
  );
}
