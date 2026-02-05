import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, TrendingUp } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { VaultLayout } from "@/components/vault/VaultLayout";
import { VaultTabs } from "@/components/vault/VaultTabs";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const Vault = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();
  const { entries } = useFinancialEntries();

  // Revenue Pulse calculation
  const goal = 20000;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthRevenue = entries
    .filter((e) => {
      const entryDate = new Date(e.date);
      return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const percentage = Math.min((currentMonthRevenue / goal) * 100, 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  useEffect(() => {
    // Admin only - Staff cannot access Vault per custom knowledge
    if (!isLoading && !isAdmin) {
      navigate("/");
      toast.error("Access restricted to administrators");
    }
  }, [isAdmin, isLoading, navigate]);

  // Show loading while checking role
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center bg-[hsl(0_0%_12%)]">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(43_65%_52%)]" />
        </div>
      </SidebarProvider>
    );
  }

  // If not authorized, don't render anything (redirect happening)
  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <VaultLayout>
        <div className="mx-auto max-w-7xl p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 flex items-center gap-3">
              <Lock className="h-5 w-5 text-[hsl(43_65%_52%)]" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(0_0%_50%)]">
                Admin Only
              </p>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-4xl font-semibold text-[hsl(45_30%_90%)]">
                  Vault
                </h1>
                <p className="mt-2 text-[hsl(0_0%_60%)]">
                  Secure access to financials, HR documents, and client database.
                </p>
              </div>

              {/* Revenue Pulse - Header Widget */}
              <div className="w-64 rounded-lg border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_10%)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[hsl(43_65%_52%)]" />
                  <span className="font-heading text-xs font-medium uppercase tracking-widest text-[hsl(0_0%_60%)]">
                    Revenue Pulse
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2 bg-[hsl(0_0%_20%)] [&>div]:bg-[hsl(43_65%_52%)]" 
                />
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-semibold text-[hsl(45_30%_90%)] tabular-nums">
                    {formatCurrency(currentMonthRevenue)}
                  </span>
                  <span className="font-mono text-xs text-[hsl(0_0%_50%)] tabular-nums">
                    / {formatCurrency(goal)} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <VaultTabs />
            </div>
          </motion.div>
        </div>
      </VaultLayout>
    </SidebarProvider>
  );
};

export default Vault;
