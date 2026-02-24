import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              You're all set.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Thank you for completing your onboarding. Our team is preparing your
              project workspace — you'll hear from us within 24 hours with next steps.
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
              onClick={() => window.location.href = "https://maison-saiso-hub.lovable.app"}
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
