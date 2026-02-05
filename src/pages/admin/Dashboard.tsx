import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  FolderKanban,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { useFinancialEntries } from "@/hooks/useFinancialEntries";
import { useProjects } from "@/hooks/useProjects";
import { AdminRevenueChart } from "@/components/admin/AdminRevenueChart";
import { MinimalistLedger } from "@/components/admin/MinimalistLedger";
import { RescheduleRequests } from "@/components/admin/RescheduleRequests";
import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { entries, isLoading: entriesLoading } = useFinancialEntries();
  const { projects, isLoading: projectsLoading } = useProjects();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      toast.error("Access restricted to administrators");
    }
  }, [isAdmin, roleLoading, navigate]);

  if (roleLoading || entriesLoading || projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  // Calculate totals
  const totalRevenue = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const agencyRevenue = entries
    .filter((e) => e.service_type === "agency")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const studioRevenue = entries
    .filter((e) => e.service_type === "studio")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Overdue and pending invoices
  const overdueInvoices = entries.filter((e) => e.payment_status === "overdue");
  const pendingInvoices = entries.filter((e) => e.payment_status === "sent");
  const watchlistItems = [...overdueInvoices, ...pendingInvoices].slice(0, 5);

  // Active projects
  const activeProjects = projects?.filter((p) => p.status === "active") || [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Executive View
            </span>
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Founder's Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            High-level business overview and financial health.
          </p>
        </motion.div>

        {/* Revenue Cards */}
        <Tabs defaultValue="unified" className="space-y-6">
          <TabsList>
            <TabsTrigger value="unified">Unified</TabsTrigger>
            <TabsTrigger value="categorized">Categorized</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl font-semibold tracking-tight">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    All-time combined
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Projects
                  </CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl font-semibold">
                    {activeProjects.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Currently in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Watchlist Items
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl font-semibold">
                    {watchlistItems.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {overdueInvoices.length} overdue, {pendingInvoices.length} pending
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminRevenueChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorized" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Agency Revenue
                  </CardTitle>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-600">
                    Agency
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl font-semibold tracking-tight">
                    {formatCurrency(agencyRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Client projects & retainers
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Studio Revenue
                  </CardTitle>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-600">
                    Studio
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="font-heading text-3xl font-semibold tracking-tight">
                    {formatCurrency(studioRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Space rentals & bookings
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Agency Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminRevenueChart filterType="agency" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Studio Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminRevenueChart filterType="studio" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Financial Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Financial Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <MinimalistLedger />
          </CardContent>
        </Card>

        {/* Project Health, Watchlist, Approval Queue & Reschedule Requests */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Active Projects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <FolderKanban className="h-4 w-4" />
                Project Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No active projects
                </p>
              ) : (
                <div className="space-y-2">
                  {activeProjects.slice(0, 4).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{project.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {project.client?.name || "No client"}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize text-[9px] h-5">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Invoice Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watchlistItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  All invoices are paid
                </p>
              ) : (
                <div className="space-y-2">
                  {watchlistItems.slice(0, 4).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">
                          {invoice.client?.name || invoice.description || "Invoice"}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(invoice.date), "MMM d")}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-ledger text-xs font-semibold tabular-nums">
                          {formatCurrency(Number(invoice.amount))}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4",
                            invoice.payment_status === "overdue"
                              ? "border-destructive/50 text-destructive"
                              : "border-amber-500/50 text-amber-600"
                          )}
                        >
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Queue */}
          <ApprovalQueue />

          {/* Reschedule Requests */}
          <RescheduleRequests />
        </div>
      </div>
    </DashboardLayout>
  );
}
