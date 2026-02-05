import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface LedgerFilters {
  serviceType: string | null;
  status: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface LedgerFilterBarProps {
  filters: LedgerFilters;
  onFiltersChange: (filters: LedgerFilters) => void;
}

export function LedgerFilterBar({ filters, onFiltersChange }: LedgerFilterBarProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const activeFilterCount = [
    filters.serviceType,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      serviceType: null,
      status: null,
      dateFrom: null,
      dateTo: null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/30 bg-muted/10 px-6 py-3">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="font-heading uppercase tracking-editorial">Filters</span>
      </div>

      {/* Service Type */}
      <Select
        value={filters.serviceType || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, serviceType: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="h-7 w-[100px] text-xs border-border/50">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="agency">Agency</SelectItem>
          <SelectItem value="studio">Studio</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="h-7 w-[100px] text-xs border-border/50">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      {/* Date From */}
      <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-7 justify-start text-xs border-border/50 font-normal",
              !filters.dateFrom && "text-muted-foreground"
            )}
          >
            {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom || undefined}
            onSelect={(date) => {
              onFiltersChange({ ...filters, dateFrom: date || null });
              setDateFromOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-7 justify-start text-xs border-border/50 font-normal",
              !filters.dateTo && "text-muted-foreground"
            )}
          >
            {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo || undefined}
            onSelect={(date) => {
              onFiltersChange({ ...filters, dateTo: date || null });
              setDateToOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Active filter count & clear */}
      {activeFilterCount > 0 && (
        <>
          <Badge variant="secondary" className="h-6 text-[10px] font-mono">
            {activeFilterCount} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
