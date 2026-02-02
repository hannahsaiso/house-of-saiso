import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioBookingCardProps {
  date: string;
  time: string;
  type: string;
  clientName?: string;
  isBlocked?: boolean;
  index?: number;
}

export function StudioBookingCard({
  date,
  time,
  type,
  clientName,
  isBlocked = false,
  index = 0,
}: StudioBookingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "border-border/50 transition-all duration-300",
          isBlocked
            ? "bg-muted/50"
            : "hover:border-primary/30 hover:shadow-md"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-sm bg-foreground text-background">
              <span className="text-xs font-medium uppercase">
                {new Date(date).toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="font-heading text-xl font-semibold">
                {new Date(date).getDate()}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Camera className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">{type}</span>
              </div>
              {clientName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {clientName}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time}
                </div>
              </div>
            </div>

            {isBlocked && (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Blocked
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
