import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface RevenueChartProps {
  monthlyTotals: Record<string, { agency: number; studio: number; total: number }>;
}

export function RevenueChart({ monthlyTotals }: RevenueChartProps) {
  const chartData = useMemo(() => {
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, data]) => ({
        month: format(parseISO(`${month}-01`), "MMM yy"),
        agency: data.agency,
        studio: data.studio,
        total: data.total,
      }));
  }, [monthlyTotals]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] p-8 text-center text-[hsl(var(--vault-muted))]">
        No data to display yet. Add financial entries to see trends.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] p-6">
      <h3 className="mb-6 font-heading text-lg font-medium text-[hsl(var(--vault-foreground))]">
        Revenue Trends
      </h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(0 0% 25%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="hsl(0 0% 50%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(0 0% 50%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 14%)",
                border: "1px solid hsl(0 0% 18%)",
                borderRadius: "8px",
                color: "hsl(45 30% 90%)",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Legend
              wrapperStyle={{ color: "hsl(0 0% 50%)", paddingTop: 20 }}
            />
            <Line
              type="monotone"
              dataKey="agency"
              stroke="hsl(220 80% 60%)"
              strokeWidth={2}
              dot={{ fill: "hsl(220 80% 60%)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="studio"
              stroke="hsl(280 60% 60%)"
              strokeWidth={2}
              dot={{ fill: "hsl(280 60% 60%)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(43 65% 52%)"
              strokeWidth={3}
              dot={{ fill: "hsl(43 65% 52%)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
