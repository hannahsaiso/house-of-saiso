 import { useState, useMemo } from "react";
 import { Progress } from "@/components/ui/progress";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { useStudioBookings } from "@/hooks/useStudioBookings";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { RevenuePulseSettings, RevenuePulseConfig } from "./RevenuePulseSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RevenuePulseProps {
  goal?: number;
}

 const LOCAL_STORAGE_KEY = "revenue-pulse-config";
 
 function loadConfig(): RevenuePulseConfig {
   try {
     const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
     if (saved) return JSON.parse(saved);
   } catch {}
   return { goal: 20000, taxReservePercent: 30, monthlyFixedCosts: 3000 };
 }
 
 function saveConfig(config: RevenuePulseConfig) {
   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
 }
 
export function RevenuePulse({ goal = 20000 }: RevenuePulseProps) {
  const { entries } = useFinancialEntries();
  const { bookings } = useStudioBookings();
   const [config, setConfig] = useState<RevenuePulseConfig>(() => ({
     ...loadConfig(),
     goal,
   }));
   const [showNetProfit, setShowNetProfit] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"month" | "quarter">("month");

  // Calculate date range based on filter
  const now = new Date();
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (timeFilter === "quarter") {
      return {
        rangeStart: startOfQuarter(now),
        rangeEnd: endOfQuarter(now),
        rangeLabel: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${format(now, "yyyy")}`,
      };
    }
    return {
      rangeStart: startOfMonth(now),
      rangeEnd: endOfMonth(now),
      rangeLabel: format(now, "MMMM yyyy"),
    };
  }, [timeFilter]);

  // Confirmed/Paid revenue (cash in bank)
  const confirmedRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: rangeStart, end: rangeEnd }) 
        && e.payment_status === "paid";
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Pending/Sent revenue (pipeline)
  const pendingRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: rangeStart, end: rangeEnd }) 
        && (e.payment_status === "sent" || e.payment_status === "overdue");
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Estimate revenue from pending bookings (not yet invoiced)
  const pendingBookingRevenue = bookings
    .filter((b) => {
      const bookingDate = new Date(b.date);
      return isWithinInterval(bookingDate, { start: rangeStart, end: rangeEnd })
        && b.status === "pending";
    })
    .length * 500; // Estimated average booking value

  const totalPipeline = pendingRevenue + pendingBookingRevenue;
  const totalRevenue = confirmedRevenue + totalPipeline;

   // Net profit calculation
   const taxAmount = confirmedRevenue * (config.taxReservePercent / 100);
   const netProfit = confirmedRevenue - taxAmount - config.monthlyFixedCosts;
   const netPipeline = totalPipeline * (1 - config.taxReservePercent / 100);
 
   const displayRevenue = showNetProfit ? Math.max(0, netProfit) : confirmedRevenue;
   const displayPipeline = showNetProfit ? netPipeline : totalPipeline;
   // Adjust goal for quarterly view
   const periodGoal = timeFilter === "quarter" ? config.goal * 3 : config.goal;
 
   const displayGoal = showNetProfit 
     ? periodGoal * (1 - config.taxReservePercent / 100) - (timeFilter === "quarter" ? config.monthlyFixedCosts * 3 : config.monthlyFixedCosts)
     : periodGoal;
 
   const confirmedPercentage = Math.min((displayRevenue / Math.max(displayGoal, 1)) * 100, 100);
   const projectedPercentage = Math.min(((displayRevenue + displayPipeline) / Math.max(displayGoal, 1)) * 100, 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

   const handleConfigSave = (newConfig: RevenuePulseConfig) => {
     setConfig(newConfig);
     saveConfig(newConfig);
   };
 
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
           <div className="flex items-center gap-1.5">
             <span className="font-heading text-[10px] font-medium uppercase tracking-editorial text-sidebar-foreground/60">
               {showNetProfit ? "Net Profit" : "Revenue"} Pulse
             </span>
             <RevenuePulseSettings config={config} onSave={handleConfigSave} />
           </div>
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as "month" | "quarter")}>
            <SelectTrigger className="h-5 w-auto gap-1 border-0 bg-transparent p-0 text-[9px] text-sidebar-foreground/50 hover:text-sidebar-foreground focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[80px]">
              <SelectItem value="month" className="text-xs">Month</SelectItem>
              <SelectItem value="quarter" className="text-xs">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Range label */}
        <p className="font-mono-ledger text-[9px] tabular-nums text-sidebar-foreground/40">
          {rangeLabel}
        </p>
        
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
                 className={cn(
                   "absolute inset-0 h-full transition-all",
                   showNetProfit && netProfit < 0
                     ? "bg-red-500/80"
                     : "bg-[hsl(var(--champagne))]"
                 )}
                style={{ width: `${confirmedPercentage}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono-ledger text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <div className={cn(
                   "h-2 w-2 rounded-full",
                   showNetProfit && netProfit < 0 ? "bg-red-500" : "bg-[hsl(var(--champagne))]"
                 )} />
                 <span>{showNetProfit ? "Net Profit" : "Confirmed"}: {formatCurrency(displayRevenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--champagne))]/30" />
                 <span>Pipeline: {formatCurrency(displayPipeline)}</span>
              </div>
               {showNetProfit && (
                 <>
                   <div className="border-t border-border/50 pt-1 mt-1">
                     <span className="text-muted-foreground">Tax Reserve: {formatCurrency(taxAmount)}</span>
                   </div>
                   <div>
                     <span className="text-muted-foreground">Fixed Costs: {formatCurrency(config.monthlyFixedCosts)}</span>
                   </div>
                 </>
               )}
            </div>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
             <span className={cn(
               "font-mono-ledger text-xs tabular-nums",
               showNetProfit && netProfit < 0 ? "text-red-500" : "text-sidebar-foreground"
             )}>
               {formatCurrency(displayRevenue)}
            </span>
             {displayPipeline > 0 && (
              <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/40">
                 +{formatCurrency(displayPipeline)}
              </span>
            )}
          </div>
          <span className="font-mono-ledger text-[10px] tabular-nums text-sidebar-foreground/50">
             / {formatCurrency(displayGoal)}
          </span>
        </div>
 
         {/* Gross/Net Toggle */}
         <div className="flex items-center justify-center gap-2 pt-1">
           <Label className="text-[9px] text-sidebar-foreground/50 cursor-pointer">Gross</Label>
           <Switch
             checked={showNetProfit}
             onCheckedChange={setShowNetProfit}
             className="h-3 w-6 data-[state=checked]:bg-[hsl(var(--champagne))]"
           />
           <Label className="text-[9px] text-sidebar-foreground/50 cursor-pointer">Net</Label>
         </div>
      </div>
    </TooltipProvider>
  );
}
