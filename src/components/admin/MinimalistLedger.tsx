import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600 border-green-500/20",
  sent: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function MinimalistLedger() {
  const { entries, isLoading } = useFinancialEntries();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground font-heading">
        No financial entries recorded.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border/30 bg-muted/20 px-8 py-4">
        <div className="col-span-2 text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Date
        </div>
        <div className="col-span-3 text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Client
        </div>
        <div className="col-span-2 text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Type
        </div>
        <div className="col-span-2 text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Description
        </div>
        <div className="col-span-2 text-right text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Amount
        </div>
        <div className="col-span-1 text-xs font-heading font-medium uppercase tracking-editorial text-muted-foreground">
          Status
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {entries.slice(0, 15).map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-12 gap-4 px-8 py-5 transition-colors hover:bg-[hsl(45_30%_96%)] dark:hover:bg-muted/20"
          >
            <div className="col-span-2 flex items-center">
              <span className="font-mono-ledger text-sm text-muted-foreground tabular-nums">
                {format(new Date(entry.date), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="col-span-3 flex items-center">
              <span className="font-heading font-medium text-sm truncate">
                {entry.client?.name || "—"}
              </span>
            </div>
            <div className="col-span-2 flex items-center">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-[10px] font-body border",
                  entry.service_type === "agency"
                    ? "border-primary/30 text-primary bg-primary/5"
                    : "border-foreground/20 text-foreground bg-foreground/5"
                )}
              >
                {entry.service_type}
              </Badge>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-sm text-muted-foreground truncate font-body">
                {entry.description || "—"}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-end">
              <span className="font-mono-ledger text-sm font-semibold tabular-nums">
                {formatCurrency(Number(entry.amount))}
              </span>
            </div>
            <div className="col-span-1 flex items-center">
              <Badge
                variant="outline"
                className={cn("capitalize text-[10px] font-body", statusStyles[entry.payment_status])}
              >
                {entry.payment_status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {entries.length > 15 && (
        <div className="border-t border-border/30 bg-muted/10 px-8 py-4 text-center">
          <span className="text-xs text-muted-foreground font-body">
            Showing 15 of {entries.length} entries
          </span>
        </div>
      )}
    </div>
  );
}