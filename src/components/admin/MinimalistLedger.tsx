import { useState, useMemo } from "react";
import { format, isWithinInterval } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { LedgerFilterBar, LedgerFilters } from "./LedgerFilters";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600 border-green-500/20",
  sent: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function MinimalistLedger() {
  const { entries, isLoading } = useFinancialEntries();
  const [filters, setFilters] = useState<LedgerFilters>({
    serviceType: null,
    status: null,
    dateFrom: null,
    dateTo: null,
  });

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Service type filter
      if (filters.serviceType && entry.service_type !== filters.serviceType) {
        return false;
      }
      // Status filter
      if (filters.status && entry.payment_status !== filters.status) {
        return false;
      }
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const entryDate = new Date(entry.date);
        if (filters.dateFrom && filters.dateTo) {
          if (!isWithinInterval(entryDate, { start: filters.dateFrom, end: filters.dateTo })) {
            return false;
          }
        } else if (filters.dateFrom && entryDate < filters.dateFrom) {
          return false;
        } else if (filters.dateTo && entryDate > filters.dateTo) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filters]);

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

  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      {/* Filter Bar */}
      <LedgerFilterBar filters={filters} onFiltersChange={setFilters} />

      {filteredEntries.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground font-heading">
          {entries.length === 0 ? "No financial entries recorded." : "No entries match your filters."}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 border-b border-border/30 bg-muted/20 px-6 py-3">
            <div className="col-span-2 text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Date
            </div>
            <div className="col-span-3 text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Client
            </div>
            <div className="col-span-2 text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Type
            </div>
            <div className="col-span-2 text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Description
            </div>
            <div className="col-span-2 text-right text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Amount
            </div>
            <div className="col-span-1 text-[10px] font-heading font-medium uppercase tracking-editorial text-muted-foreground">
              Status
            </div>
          </div>

          {/* Rows - Reduced padding for density */}
          <div className="divide-y divide-border/20">
            {filteredEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 gap-3 px-6 py-3 transition-colors hover:bg-[hsl(45_30%_96%)] dark:hover:bg-muted/20"
              >
                <div className="col-span-2 flex items-center">
                  <span className="font-mono-ledger text-xs text-muted-foreground tabular-nums">
                    {format(new Date(entry.date), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-heading font-medium text-xs truncate">
                    {entry.client?.name || "—"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-[9px] font-body border h-5 px-1.5",
                      entry.service_type === "agency"
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-foreground/20 text-foreground bg-foreground/5"
                    )}
                  >
                    {entry.service_type}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-xs text-muted-foreground truncate font-body">
                    {entry.description || "—"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="font-mono-ledger text-xs font-semibold tabular-nums">
                    {formatCurrency(Number(entry.amount))}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <Badge
                    variant="outline"
                    className={cn("capitalize text-[9px] font-body h-5 px-1.5", statusStyles[entry.payment_status])}
                  >
                    {entry.payment_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {filteredEntries.length > 20 && (
            <div className="border-t border-border/30 bg-muted/10 px-6 py-3 text-center">
              <span className="text-xs text-muted-foreground font-body">
                Showing 20 of {filteredEntries.length} entries
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}