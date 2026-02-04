import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingSubmissionCard } from "./OnboardingSubmissionCard";
import { ClientProfileSheet } from "./ClientProfileSheet";
import { useRecentOnboardings, type OnboardingSubmission } from "@/hooks/useRecentOnboardings";

export function OnboardingQueue() {
  const navigate = useNavigate();
  const { data: submissions, isLoading } = useRecentOnboardings(5);
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleViewProfile = (submission: OnboardingSubmission) => {
    setSelectedSubmission(submission);
    setSheetOpen(true);
  };

  const handleStartTaskSetup = (submission: OnboardingSubmission) => {
    if (submission.projectId) {
      // Navigate to project workspace (to be implemented)
      navigate(`/projects/${submission.projectId}`);
    } else {
      // For now, navigate to projects page
      navigate("/projects");
    }
    setSheetOpen(false);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Onboarding Queue</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card/50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="mb-3 flex gap-1.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="mb-4 h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Empty state
  if (!submissions || submissions.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Onboarding Queue</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 py-12">
          <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <h3 className="mb-1 font-heading text-lg font-medium">No recent onboardings</h3>
          <p className="text-sm text-muted-foreground">
            New client submissions will appear here.
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Onboarding Queue</h2>
        <button className="text-xs font-medium uppercase tracking-editorial text-muted-foreground transition-colors hover:text-foreground">
          View All
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission, index) => (
          <OnboardingSubmissionCard
            key={submission.id}
            submission={submission}
            index={index}
            onViewProfile={() => handleViewProfile(submission)}
            onStartTaskSetup={() => handleStartTaskSetup(submission)}
          />
        ))}
      </div>

      <ClientProfileSheet
        submission={selectedSubmission}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartTaskSetup={() =>
          selectedSubmission && handleStartTaskSetup(selectedSubmission)
        }
      />
    </motion.section>
  );
}
