import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Loader2, MoreHorizontal, TrendingUp, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useFinancialEntries, FinancialEntry } from "@/hooks/useFinancialEntries";
import { FinancialEntryDialog } from "./FinancialEntryDialog";
import { RevenueChart } from "./RevenueChart";
import { cn } from "@/lib/utils";

type MarginFilter = "all" | "high-margin" | "maintenance";

const statusStyles: Record<string, string> = {
  paid: "bg-[hsl(var(--vault-success))]/20 text-[hsl(var(--vault-success))] border-[hsl(var(--vault-success))]/30",
  sent: "bg-[hsl(var(--vault-warning))]/20 text-[hsl(var(--vault-warning))] border-[hsl(var(--vault-warning))]/30",
  overdue: "bg-[hsl(var(--vault-danger))]/20 text-[hsl(var(--vault-danger))] border-[hsl(var(--vault-danger))]/30",
};

export function FinancialLedger() {
  const { entries, isLoading, monthlyTotals, deleteEntry, updateEntry } = useFinancialEntries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [marginFilter, setMarginFilter] = useState<MarginFilter>("all");

  const handleEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntry.mutateAsync(id);
    }
  };

  const handleStatusChange = async (id: string, status: "sent" | "paid" | "overdue") => {
    await updateEntry.mutateAsync({ id, payment_status: status });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Filter entries by margin type
  const filteredEntries = useMemo(() => {
    if (marginFilter === "all") return entries;
    if (marginFilter === "high-margin") {
      // Studio rentals have higher margins
      return entries.filter((e) => e.service_type === "studio");
    }
    // Maintenance = agency (lower margin, more labor)
    return entries.filter((e) => e.service_type === "agency");
  }, [entries, marginFilter]);

  // Calculate totals
  const totalRevenue = filteredEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const paidAmount = filteredEntries
    .filter((e) => e.payment_status === "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const outstandingAmount = filteredEntries
    .filter((e) => e.payment_status !== "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] p-6">
          <p className="text-xs font-medium uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
            Total Revenue
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-[hsl(var(--vault-accent))]">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] p-6">
          <p className="text-xs font-medium uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
            Collected
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-[hsl(var(--vault-success))]">
            {formatCurrency(paidAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] p-6">
          <p className="text-xs font-medium uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
            Outstanding
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-[hsl(var(--vault-warning))]">
            {formatCurrency(outstandingAmount)}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <RevenueChart monthlyTotals={monthlyTotals} />

      {/* Ledger Table */}
      <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--vault-border))] p-4">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg font-medium">Financial Ledger</h3>
            {/* Quick Filters */}
            <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--vault-border))] p-1">
              <button
                onClick={() => setMarginFilter("all")}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  marginFilter === "all"
                    ? "bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))]"
                    : "text-[hsl(var(--vault-muted))] hover:text-[hsl(var(--vault-foreground))]"
                )}
              >
                All
              </button>
              <button
                onClick={() => setMarginFilter("high-margin")}
                className={cn(
                  "flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors",
                  marginFilter === "high-margin"
                    ? "bg-[hsl(var(--vault-success))] text-[hsl(var(--vault-background))]"
                    : "text-[hsl(var(--vault-muted))] hover:text-[hsl(var(--vault-foreground))]"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                High-Margin
              </button>
              <button
                onClick={() => setMarginFilter("maintenance")}
                className={cn(
                  "flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors",
                  marginFilter === "maintenance"
                    ? "bg-[hsl(var(--vault-warning))] text-[hsl(var(--vault-background))]"
                    : "text-[hsl(var(--vault-muted))] hover:text-[hsl(var(--vault-foreground))]"
                )}
              >
                <Wrench className="h-3 w-3" />
                Maintenance
              </button>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              setIsDialogOpen(true);
            }}
            className="gap-2 bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))] hover:bg-[hsl(var(--vault-accent))]/90"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--vault-accent))]" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-[hsl(var(--vault-muted))]">
            {entries.length === 0 ? "No financial entries yet. Click \"New Entry\" to add one." : "No entries match the selected filter."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--vault-border))] hover:bg-transparent">
                <TableHead className="text-[hsl(var(--vault-accent))]">Date</TableHead>
                <TableHead className="text-[hsl(var(--vault-accent))]">Client</TableHead>
                <TableHead className="text-[hsl(var(--vault-accent))]">Service</TableHead>
                <TableHead className="text-[hsl(var(--vault-accent))]">Description</TableHead>
                <TableHead className="text-right text-[hsl(var(--vault-accent))]">Amount</TableHead>
                <TableHead className="text-[hsl(var(--vault-accent))]">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="border-[hsl(var(--vault-border))] hover:bg-[hsl(var(--vault-background))]/50"
                >
                  <TableCell className="font-medium">
                    {format(new Date(entry.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {entry.client?.name || (
                      <span className="text-[hsl(var(--vault-muted))]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize border-[hsl(var(--vault-border))]",
                        entry.service_type === "agency"
                          ? "text-blue-400"
                          : "text-purple-400"
                      )}
                    >
                      {entry.service_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-[hsl(var(--vault-muted-foreground))]">
                    {entry.description || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(entry.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", statusStyles[entry.payment_status])}
                    >
                      {entry.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[hsl(var(--vault-muted))] hover:text-[hsl(var(--vault-foreground))]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]"
                      >
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(entry.id, "paid")}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(entry.id, "overdue")}
                        >
                          Mark as Overdue
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(entry.id)}
                          className="text-[hsl(var(--vault-danger))]"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <FinancialEntryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entry={editingEntry}
      />
    </div>
  );
}
