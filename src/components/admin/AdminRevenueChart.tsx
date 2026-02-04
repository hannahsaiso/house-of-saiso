import { useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface AdminRevenueChartProps {
  filterType?: "agency" | "studio";
}

export function AdminRevenueChart({ filterType }: AdminRevenueChartProps) {
  const { entries } = useFinancialEntries();

  const chartData = useMemo(() => {
    // Get last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return format(startOfMonth(date), "yyyy-MM");
    });

    return months.map((month) => {
      const monthEntries = entries.filter((e) => {
        const entryMonth = format(parseISO(e.date), "yyyy-MM");
        if (filterType) {
          return entryMonth === month && e.service_type === filterType;
        }
        return entryMonth === month;
      });

      const total = monthEntries.reduce((sum, e) => sum + Number(e.amount), 0);
      const agency = monthEntries
        .filter((e) => e.service_type === "agency")
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const studio = monthEntries
        .filter((e) => e.service_type === "studio")
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        month: format(parseISO(month + "-01"), "MMM"),
        total,
        agency,
        studio,
      };
    });
  }, [entries, filterType]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getColor = () => {
    if (filterType === "agency") return "hsl(217, 91%, 60%)";
    if (filterType === "studio") return "hsl(271, 91%, 65%)";
    return "hsl(var(--primary))";
  };

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${filterType || "total"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getColor()} stopOpacity={0.3} />
              <stop offset="100%" stopColor={getColor()} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [formatCurrency(value), filterType || "Revenue"]}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey={filterType || "total"}
            stroke={getColor()}
            strokeWidth={2}
            fill={`url(#gradient-${filterType || "total"})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
