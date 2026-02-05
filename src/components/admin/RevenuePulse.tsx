import { Progress } from "@/components/ui/progress";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { useStudioBookings } from "@/hooks/useStudioBookings";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RevenuePulseProps {
  goal?: number;
}

export function RevenuePulse({ goal = 20000 }: RevenuePulseProps) {
  const { entries } = useFinancialEntries();
  const { bookings } = useStudioBookings();

  // Calculate current month revenue
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Confirmed/Paid revenue (cash in bank)
  const confirmedRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd }) 
        && e.payment_status === "paid";
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Pending/Sent revenue (pipeline)
  const pendingRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd }) 
        && (e.payment_status === "sent" || e.payment_status === "overdue");
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Estimate revenue from pending bookings (not yet invoiced)
  const pendingBookingRevenue = bookings
    .filter((b) => {
      const bookingDate = new Date(b.date);
      return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd })
        && b.status === "pending";
    })
    .length * 500; // Estimated average booking value

  const totalPipeline = pendingRevenue + pendingBookingRevenue;
  const totalRevenue = confirmedRevenue + totalPipeline;

  const confirmedPercentage = Math.min((confirmedRevenue / goal) * 100, 100);
  const projectedPercentage = Math.min((totalRevenue / goal) * 100, 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-[10px] font-medium uppercase tracking-editorial text-sidebar-foreground/60">
            Revenue Pulse
          </span>
          <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/80">
            {confirmedPercentage.toFixed(0)}%
          </span>
        </div>
        
        {/* Stacked Progress Bar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-sidebar-accent/30">
              {/* Projected/Pipeline bar (ghosted) */}
              <div 
                className="absolute inset-0 h-full bg-[hsl(var(--champagne))]/30 transition-all"
                style={{ width: `${projectedPercentage}%` }}
              />
              {/* Confirmed bar (solid) */}
              <div 
                className="absolute inset-0 h-full bg-[hsl(var(--champagne))] transition-all"
                style={{ width: `${confirmedPercentage}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono-ledger text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--champagne))]" />
                <span>Confirmed: {formatCurrency(confirmedRevenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--champagne))]/30" />
                <span>Pipeline: {formatCurrency(totalPipeline)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-ledger text-xs tabular-nums text-sidebar-foreground">
              {formatCurrency(confirmedRevenue)}
            </span>
            {totalPipeline > 0 && (
              <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/40">
                +{formatCurrency(totalPipeline)}
              </span>
            )}
          </div>
          <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/50">
            / {formatCurrency(goal)}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
