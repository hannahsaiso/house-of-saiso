import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

export function SuccessAnimation({
  show,
  onComplete,
  message = "Success!",
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Checkmark circle with glow */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 12 }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.5, 2] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
              />
              
              {/* Outer ring */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary bg-primary/10"
              >
                {/* Checkmark */}
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                >
                  <Check className="h-12 w-12 text-primary" strokeWidth={3} />
                </motion.div>
              </motion.div>

              {/* Particle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 60,
                    y: Math.sin((i * Math.PI * 2) / 8) * 60,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                />
              ))}
            </motion.div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-heading text-xl font-semibold text-foreground"
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
