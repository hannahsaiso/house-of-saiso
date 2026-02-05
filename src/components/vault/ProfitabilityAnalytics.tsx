 import { useMemo } from "react";
 import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Clock, DollarSign, Building2, Megaphone } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { useFinancialEntries } from "@/hooks/useFinancialEntries";
 import { useProjectTimeSummary } from "@/hooks/useTimeLogs";
 import { cn } from "@/lib/utils";
 
// Cost configuration
const STAFF_HOURLY_RATE = 45; // $45/hour for creative labor
const STUDIO_FIXED_COST = 50; // $50 fixed cost per booking (utilities, wear)
const STUDIO_OPERATIONAL_HOURS = 1; // 1 hour operational time (reset/cleaning)
 
// Studio is PASSIVE revenue - only fixed cost + operational time for reset
// Agency is SERVICE revenue - requires creative labor hours
 
 export function ProfitabilityAnalytics() {
   const { entries } = useFinancialEntries();
   const { projectHours } = useProjectTimeSummary();
 
  const analytics = useMemo(() => {
    // Agency: Service Revenue - requires creative labor
     let agencyHours = 0;
     
     const studioEntries = entries.filter((e) => e.service_type === "studio");
     const agencyEntries = entries.filter((e) => e.service_type === "agency");
     
    // Only count hours for agency projects (creative labor)
     agencyEntries.forEach((e) => {
       if (e.project_id && projectHours[e.project_id]) {
         agencyHours += projectHours[e.project_id].totalHours;
       }
     });
     
     const studioRevenue = studioEntries.reduce((sum, e) => sum + Number(e.amount), 0);
     const agencyRevenue = agencyEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const studioBookingCount = studioEntries.length;
 
    // STUDIO: Passive Revenue - Fixed costs only + operational time for reset
    // No creative labor - clients handle their own post-production
    const studioFixedCosts = studioBookingCount * STUDIO_FIXED_COST;
    const studioOperationalCost = studioBookingCount * STUDIO_OPERATIONAL_HOURS * STAFF_HOURLY_RATE;
    const studioTotalCost = studioFixedCosts + studioOperationalCost;

    // AGENCY: Service Revenue - Requires creative labor hours
    const agencyLaborCost = agencyHours > 0 
      ? agencyHours * STAFF_HOURLY_RATE 
      : agencyRevenue * 0.6; // Fallback 60% cost ratio
 
    const studioMargin = studioRevenue - studioTotalCost;
     const agencyMargin = agencyRevenue - agencyLaborCost;
 
     const studioMarginPct = studioRevenue > 0 ? (studioMargin / studioRevenue) * 100 : 0;
     const agencyMarginPct = agencyRevenue > 0 ? (agencyMargin / agencyRevenue) * 100 : 0;
 
     const totalRevenue = studioRevenue + agencyRevenue;
    const totalProfit = studioMargin + agencyMargin;
     const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
 
     return {
       studio: {
         revenue: studioRevenue,
         margin: studioMargin,
         marginPct: studioMarginPct,
        count: studioBookingCount,
        fixedCost: studioFixedCosts,
        operationalCost: studioOperationalCost,
        totalCost: studioTotalCost,
        revenueType: "Passive / Product",
       },
       agency: {
         revenue: agencyRevenue,
         margin: agencyMargin,
         marginPct: agencyMarginPct,
         count: agencyEntries.length,
         hours: agencyHours,
         laborCost: agencyLaborCost,
        revenueType: "Service / Labor",
        isHoursLogged: agencyHours > 0,
       },
       total: {
         revenue: totalRevenue,
         profit: totalProfit,
         margin: overallMargin,
        hours: agencyHours, // Only creative hours matter
       },
     };
   }, [entries, projectHours]);
 
   const formatCurrency = (amount: number) =>
     new Intl.NumberFormat("en-US", {
       style: "currency",
       currency: "USD",
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(amount);
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[hsl(var(--vault-accent))]" />
           <h3 className="font-heading text-lg font-semibold text-[hsl(var(--vault-foreground))]">
             Service Profitability
           </h3>
         </div>
         <div className="flex items-center gap-2 text-xs text-[hsl(var(--vault-muted))]">
           <Clock className="h-3.5 w-3.5" />
           <span className="font-mono-ledger tabular-nums">
            {analytics.total.hours.toFixed(1)}h creative labor
           </span>
           <span className="text-[hsl(var(--vault-muted))]/50">•</span>
           <span className="font-mono-ledger tabular-nums">
             ${STAFF_HOURLY_RATE}/hr rate
           </span>
         </div>
       </div>
 
       {/* Comparison Cards */}
       <div className="grid gap-4 md:grid-cols-2">
         {/* Studio Card */}
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
         >
           <Card className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[hsl(var(--vault-accent))]" />
                  <span className="font-heading text-base text-[hsl(var(--vault-foreground))]">
                    Studio Rental
                  </span>
                </div>
                 <span className={cn(
                   "font-mono-ledger text-lg font-bold tabular-nums",
                   analytics.studio.marginPct >= 60 ? "text-[hsl(var(--vault-success))]" : 
                   analytics.studio.marginPct >= 30 ? "text-[hsl(var(--vault-warning))]" : 
                   "text-[hsl(var(--vault-danger))]"
                 )}>
                   {analytics.studio.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
              <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                {analytics.studio.revenueType}
              </p>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress
                 value={Math.max(0, analytics.studio.marginPct)}
                 className="h-2 bg-[hsl(var(--vault-muted))]/20 [&>div]:bg-[hsl(var(--vault-success))]"
               />
               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                     Revenue
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-foreground))]">
                     {formatCurrency(analytics.studio.revenue)}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                      Fixed + Ops Cost
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-warning))]">
                      {formatCurrency(analytics.studio.totalCost)}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                     Net Margin
                   </p>
                   <p className={cn(
                     "font-mono-ledger text-sm font-semibold tabular-nums",
                     analytics.studio.margin >= 0 ? "text-[hsl(var(--vault-success))]" : "text-[hsl(var(--vault-danger))]"
                   )}>
                     {formatCurrency(analytics.studio.margin)}
                   </p>
                 </div>
               </div>
               <div className="flex items-center justify-between text-xs text-[hsl(var(--vault-muted))]">
                  <span>{analytics.studio.count} bookings</span>
                  <span className="font-mono-ledger tabular-nums text-[10px]">
                    ${STUDIO_FIXED_COST} fixed + {STUDIO_OPERATIONAL_HOURS}h ops/booking
                  </span>
               </div>
             </CardContent>
           </Card>
         </motion.div>
 
         {/* Agency Card */}
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
         >
           <Card className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[hsl(var(--vault-accent))]" />
                  <span className="font-heading text-base text-[hsl(var(--vault-foreground))]">
                    Agency Marketing
                  </span>
                </div>
                 <span className={cn(
                   "font-mono-ledger text-lg font-bold tabular-nums",
                   analytics.agency.marginPct >= 60 ? "text-[hsl(var(--vault-success))]" : 
                   analytics.agency.marginPct >= 30 ? "text-[hsl(var(--vault-warning))]" : 
                   "text-[hsl(var(--vault-danger))]"
                 )}>
                   {analytics.agency.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
              <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                {analytics.agency.revenueType}
              </p>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress
                 value={Math.max(0, analytics.agency.marginPct)}
                 className="h-2 bg-[hsl(var(--vault-muted))]/20 [&>div]:bg-[hsl(var(--vault-warning))]"
               />
               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                     Revenue
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-foreground))]">
                     {formatCurrency(analytics.agency.revenue)}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                     Labor Cost
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-warning))]">
                     {formatCurrency(analytics.agency.laborCost)}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                     Net Margin
                   </p>
                   <p className={cn(
                     "font-mono-ledger text-sm font-semibold tabular-nums",
                     analytics.agency.margin >= 0 ? "text-[hsl(var(--vault-success))]" : "text-[hsl(var(--vault-danger))]"
                   )}>
                     {formatCurrency(analytics.agency.margin)}
                   </p>
                 </div>
               </div>
               <div className="flex items-center justify-between text-xs text-[hsl(var(--vault-muted))]">
                  <span>{analytics.agency.count} projects</span>
                 <span className="font-mono-ledger tabular-nums">
                    {analytics.agency.isHoursLogged 
                     ? `${analytics.agency.hours.toFixed(1)}h logged` 
                      : "Using 60% cost estimate"}
                 </span>
               </div>
             </CardContent>
           </Card>
         </motion.div>
       </div>
 
       {/* Overall Summary */}
       <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
       >
         <Card className="border-[hsl(var(--vault-accent))]/30 bg-gradient-to-r from-[hsl(var(--vault-card))] to-[hsl(var(--vault-accent))]/5">
           <CardContent className="flex items-center justify-between p-6">
             <div className="flex items-center gap-4">
               <div className="rounded-full bg-[hsl(var(--vault-accent))]/20 p-3">
                 <TrendingUp className="h-5 w-5 text-[hsl(var(--vault-accent))]" />
               </div>
               <div>
                 <p className="text-xs font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                   Blended Margin
               </p>
                 <p className="font-heading text-2xl font-semibold text-[hsl(var(--vault-foreground))]">
                   {analytics.total.margin.toFixed(1)}%
               </p>
               </div>
             </div>
             <div className="text-right">
               <p className="text-xs font-heading uppercase tracking-editorial text-[hsl(var(--vault-muted))]">
                 Total Profit
               </p>
               <p className="font-mono-ledger text-2xl font-bold tabular-nums text-[hsl(var(--vault-accent))]">
                 {formatCurrency(analytics.total.profit)}
               </p>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   );
 }