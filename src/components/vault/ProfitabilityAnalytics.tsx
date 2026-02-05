 import { useMemo } from "react";
 import { motion } from "framer-motion";
 import { TrendingUp, BarChart3, Clock, DollarSign } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { useFinancialEntries } from "@/hooks/useFinancialEntries";
 import { useProjectTimeSummary } from "@/hooks/useTimeLogs";
 import { cn } from "@/lib/utils";
 
 // Default hourly rate for staff (can be made configurable)
 const STAFF_HOURLY_RATE = 45; // $45/hour
 
 // Fallback cost ratios when no hours logged
 const FALLBACK_COST_RATIOS: Record<string, number> = {
   studio: 0.2, // 20% cost = 80% margin
   agency: 0.6, // 60% cost = 40% margin
 };
 
 export function ProfitabilityAnalytics() {
   const { entries } = useFinancialEntries();
   const { projectHours } = useProjectTimeSummary();
 
 const analytics = useMemo(() => {
     // Calculate total hours logged per service type
     let studioHours = 0;
     let agencyHours = 0;
     
     // Match financial entries to projects and their hours
     const studioEntries = entries.filter((e) => e.service_type === "studio");
     const agencyEntries = entries.filter((e) => e.service_type === "agency");
     
     studioEntries.forEach((e) => {
       if (e.project_id && projectHours[e.project_id]) {
         studioHours += projectHours[e.project_id].totalHours;
       }
     });
     
     agencyEntries.forEach((e) => {
       if (e.project_id && projectHours[e.project_id]) {
         agencyHours += projectHours[e.project_id].totalHours;
       }
     });
     
     const studioRevenue = studioEntries.reduce((sum, e) => sum + Number(e.amount), 0);
     const agencyRevenue = agencyEntries.reduce((sum, e) => sum + Number(e.amount), 0);
 
     // Calculate costs based on hours logged (dynamic) or fallback to static ratios
     const studioLaborCost = studioHours > 0 ? studioHours * STAFF_HOURLY_RATE : studioRevenue * FALLBACK_COST_RATIOS.studio;
     const agencyLaborCost = agencyHours > 0 ? agencyHours * STAFF_HOURLY_RATE : agencyRevenue * FALLBACK_COST_RATIOS.agency;
 
     const studioMargin = studioRevenue - studioLaborCost;
     const agencyMargin = agencyRevenue - agencyLaborCost;
 
     const studioMarginPct = studioRevenue > 0 ? (studioMargin / studioRevenue) * 100 : 0;
     const agencyMarginPct = agencyRevenue > 0 ? (agencyMargin / agencyRevenue) * 100 : 0;
 
     const totalRevenue = studioRevenue + agencyRevenue;
     const totalProfit = studioMargin + agencyMargin;
     const totalHours = studioHours + agencyHours;
     const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
 
     return {
       studio: {
         revenue: studioRevenue,
         margin: studioMargin,
         marginPct: studioMarginPct,
         count: studioEntries.length,
         hours: studioHours,
         laborCost: studioLaborCost,
         isCalculated: studioHours > 0,
       },
       agency: {
         revenue: agencyRevenue,
         margin: agencyMargin,
         marginPct: agencyMarginPct,
         count: agencyEntries.length,
         hours: agencyHours,
         laborCost: agencyLaborCost,
         isCalculated: agencyHours > 0,
       },
       total: {
         revenue: totalRevenue,
         profit: totalProfit,
         margin: overallMargin,
         hours: totalHours,
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
             {analytics.total.hours.toFixed(1)}h logged
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
                 <span className="font-heading text-base text-[hsl(var(--vault-foreground))]">
                   Studio Rental
                 </span>
                 <span className={cn(
                   "font-mono-ledger text-lg font-bold tabular-nums",
                   analytics.studio.marginPct >= 60 ? "text-[hsl(var(--vault-success))]" : 
                   analytics.studio.marginPct >= 30 ? "text-[hsl(var(--vault-warning))]" : 
                   "text-[hsl(var(--vault-danger))]"
                 )}>
                   {analytics.studio.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
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
                     Labor Cost
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-warning))]">
                     {formatCurrency(analytics.studio.laborCost)}
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
                 <span>{analytics.studio.count} transactions</span>
                 <span className="font-mono-ledger tabular-nums">
                   {analytics.studio.isCalculated 
                     ? `${analytics.studio.hours.toFixed(1)}h logged` 
                     : "Using estimated costs"}
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
                 <span className="font-heading text-base text-[hsl(var(--vault-foreground))]">
                   Agency Marketing
                 </span>
                 <span className={cn(
                   "font-mono-ledger text-lg font-bold tabular-nums",
                   analytics.agency.marginPct >= 60 ? "text-[hsl(var(--vault-success))]" : 
                   analytics.agency.marginPct >= 30 ? "text-[hsl(var(--vault-warning))]" : 
                   "text-[hsl(var(--vault-danger))]"
                 )}>
                   {analytics.agency.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
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
                 <span>{analytics.agency.count} transactions</span>
                 <span className="font-mono-ledger tabular-nums">
                   {analytics.agency.isCalculated 
                     ? `${analytics.agency.hours.toFixed(1)}h logged` 
                     : "Using estimated costs"}
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