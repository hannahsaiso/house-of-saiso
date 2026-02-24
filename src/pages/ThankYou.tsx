import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

export default function ThankYou() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Thank You | House of Saiso</title>
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-lg w-full text-center space-y-8"
        >
          {/* Celebratory animation */}
          <div className="relative mx-auto w-24 h-24">
            {/* Sparkle ring */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <motion.div
                key={deg}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.8] }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-36px)`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-serif">
              We've received your onboarding form.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We are diving in and will be in touch shortly. Thank you for trusting House of Saiso
              with your brand.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 space-y-4"
          >
            <div className="rounded-lg border border-border bg-card p-5 text-left space-y-2">
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Your dedicated project folder is being created
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  A creative brief is being generated from your inputs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Your coordinator will reach out to schedule a kickoff
                </li>
              </ul>
            </div>

            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={() => (window.location.href = "https://maison-saiso-hub.lovable.app")}
            >
              Back to House of Saiso
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
