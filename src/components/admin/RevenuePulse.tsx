import { Progress } from "@/components/ui/progress";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface RevenuePulseProps {
  goal?: number;
}

export function RevenuePulse({ goal = 20000 }: RevenuePulseProps) {
  const { entries } = useFinancialEntries();

  // Calculate current month revenue
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const percentage = Math.min((currentMonthRevenue / goal) * 100, 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-heading text-[10px] font-medium uppercase tracking-editorial text-sidebar-foreground/60">
          Revenue Pulse
        </span>
        <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/80">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-1.5 bg-sidebar-accent/30 [&>div]:bg-[hsl(var(--champagne))]" 
      />
      <div className="flex items-baseline justify-between">
        <span className="font-mono-ledger text-xs tabular-nums text-sidebar-foreground">
          {formatCurrency(currentMonthRevenue)}
        </span>
        <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/50">
          / {formatCurrency(goal)}
        </span>
      </div>
    </div>
  );
}
