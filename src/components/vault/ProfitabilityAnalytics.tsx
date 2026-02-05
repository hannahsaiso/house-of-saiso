 import { useMemo } from "react";
 import { motion } from "framer-motion";
 import { TrendingUp, BarChart3, DollarSign } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { useFinancialEntries } from "@/hooks/useFinancialEntries";
 import { cn } from "@/lib/utils";
 
 // Estimated cost ratios for margin calculation
 const COST_RATIOS: Record<string, number> = {
   studio: 0.2, // 20% cost = 80% margin
   agency: 0.6, // 60% cost = 40% margin
 };
 
 export function ProfitabilityAnalytics() {
   const { entries } = useFinancialEntries();
 
   const analytics = useMemo(() => {
     const studioRevenue = entries
       .filter((e) => e.service_type === "studio")
       .reduce((sum, e) => sum + Number(e.amount), 0);
     
     const agencyRevenue = entries
       .filter((e) => e.service_type === "agency")
       .reduce((sum, e) => sum + Number(e.amount), 0);
 
     const studioMargin = studioRevenue * (1 - COST_RATIOS.studio);
     const agencyMargin = agencyRevenue * (1 - COST_RATIOS.agency);
 
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
         count: entries.filter((e) => e.service_type === "studio").length,
       },
       agency: {
         revenue: agencyRevenue,
         margin: agencyMargin,
         marginPct: agencyMarginPct,
         count: entries.filter((e) => e.service_type === "agency").length,
       },
       total: {
         revenue: totalRevenue,
         profit: totalProfit,
         margin: overallMargin,
       },
     };
   }, [entries]);
 
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
       <div className="flex items-center gap-2">
         <BarChart3 className="h-5 w-5 text-[hsl(var(--vault-accent))]" />
         <h3 className="font-heading text-lg font-semibold text-[hsl(var(--vault-foreground))]">
           Service Profitability
         </h3>
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
                 <span className="font-mono-ledger text-lg font-bold tabular-nums text-[hsl(var(--vault-success))]">
                   {analytics.studio.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress
                 value={analytics.studio.marginPct}
                 className="h-2 bg-[hsl(var(--vault-muted))]/20 [&>div]:bg-[hsl(var(--vault-success))]"
               />
               <div className="grid grid-cols-2 gap-4">
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
                     Net Margin
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-success))]">
                     {formatCurrency(analytics.studio.margin)}
                   </p>
                 </div>
               </div>
               <p className="text-xs text-[hsl(var(--vault-muted))]">
                 {analytics.studio.count} transactions • High operational efficiency
               </p>
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
                 <span className="font-mono-ledger text-lg font-bold tabular-nums text-[hsl(var(--vault-warning))]">
                   {analytics.agency.marginPct.toFixed(0)}%
                 </span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress
                 value={analytics.agency.marginPct}
                 className="h-2 bg-[hsl(var(--vault-muted))]/20 [&>div]:bg-[hsl(var(--vault-warning))]"
               />
               <div className="grid grid-cols-2 gap-4">
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
                     Net Margin
                   </p>
                   <p className="font-mono-ledger text-sm font-semibold tabular-nums text-[hsl(var(--vault-warning))]">
                     {formatCurrency(analytics.agency.margin)}
                   </p>
                 </div>
               </div>
               <p className="text-xs text-[hsl(var(--vault-muted))]">
                 {analytics.agency.count} transactions • Labor-intensive
               </p>
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