import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { startOfMonth, subMonths, format } from "date-fns";

export function FinancialHealthWidget() {
  const { entries, isLoading } = useFinancialEntries();

  const stats = useMemo(() => {
    if (!entries.length) return { total: 0, growth: 0, isPositive: true };

    const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate monthly growth
    const currentMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = currentMonthStart;

    const currentMonthRevenue = entries
      .filter((e) => new Date(e.date) >= currentMonthStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const lastMonthRevenue = entries
      .filter((e) => {
        const date = new Date(e.date);
        return date >= lastMonthStart && date < lastMonthEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    let growth = 0;
    if (lastMonthRevenue > 0) {
      growth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    }

    return {
      total,
      growth: Math.round(growth),
      isPositive: growth >= 0,
    };
  }, [entries]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-1 animate-pulse">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-5 w-12 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-sidebar-foreground/50">
        Revenue
      </p>
      <p className="font-heading text-lg font-semibold text-sidebar-foreground">
        {formatCurrency(stats.total)}
      </p>
      <div
        className={`flex items-center gap-1 text-[10px] ${
          stats.isPositive ? "text-green-500" : "text-red-400"
        }`}
      >
        {stats.isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>
          {stats.isPositive ? "+" : ""}
          {stats.growth}% MoM
        </span>
      </div>
    </div>
  );
}
