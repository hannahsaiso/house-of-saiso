import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { PerformanceLog as PerformanceLogType } from "@/hooks/usePerformanceLogs";

interface PerformanceLogProps {
  logs: PerformanceLogType[];
  isLoading: boolean;
}

export function PerformanceLog({ logs, isLoading }: PerformanceLogProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--vault-muted))]" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-[hsl(var(--vault-muted))]">
        No performance notes yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="border-l-2 border-[hsl(var(--vault-accent))]/30 pl-4"
        >
          <p className="text-xs text-[hsl(var(--vault-muted))]">
            {format(new Date(log.log_date), "MMMM d, yyyy")}
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--vault-foreground))]">
            "{log.note}"
          </p>
        </div>
      ))}
    </div>
  );
}
