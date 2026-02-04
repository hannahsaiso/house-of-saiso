import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Building2, User, Eye, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingSubmission } from "@/hooks/useRecentOnboardings";

interface OnboardingSubmissionCardProps {
  submission: OnboardingSubmission;
  index: number;
  onViewProfile: () => void;
  onStartTaskSetup: () => void;
}

export function OnboardingSubmissionCard({
  submission,
  index,
  onViewProfile,
  onStartTaskSetup,
}: OnboardingSubmissionCardProps) {
  const relativeTime = formatDistanceToNow(new Date(submission.onboardedAt), {
    addSuffix: true,
  });

  const truncatedVision = submission.projectGoals
    ? submission.projectGoals.length > 80
      ? `${submission.projectGoals.slice(0, 80)}...`
      : submission.projectGoals
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-5">
          {/* Header Row */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold">
                  {submission.company || "Unnamed Company"}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {submission.contactName}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{relativeTime}</span>
          </div>

          {/* Services Tags */}
          {submission.servicesNeeded && submission.servicesNeeded.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {submission.servicesNeeded.slice(0, 3).map((service) => (
                <Badge
                  key={service}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {service}
                </Badge>
              ))}
              {submission.servicesNeeded.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{submission.servicesNeeded.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Vision Preview */}
          {truncatedVision && (
            <p className="mb-4 text-sm italic text-muted-foreground">
              "{truncatedVision}"
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProfile}
              className="flex-1 gap-1.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              View Profile
            </Button>
            <Button
              size="sm"
              onClick={onStartTaskSetup}
              className="flex-1 gap-1.5 text-xs"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Start Task Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
