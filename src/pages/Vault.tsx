import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { VaultLayout } from "@/components/vault/VaultLayout";
import { VaultTabs } from "@/components/vault/VaultTabs";
import { SidebarProvider } from "@/components/ui/sidebar";

const Vault = () => {
  const navigate = useNavigate();
  const { isAdminOrStaff, isAdmin, isLoading } = useUserRole();

  useEffect(() => {
    // Staff can access but with limited tabs (handled in VaultTabs)
    if (!isLoading && !isAdminOrStaff) {
      navigate("/");
      toast.error("Access restricted to staff and administrators");
    }
  }, [isAdminOrStaff, isLoading, navigate]);

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
  if (!isAdminOrStaff) {
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
                {isAdmin ? "Admin Only" : "Staff Access"}
              </p>
            </div>
            <h1 className="font-heading text-4xl font-semibold text-[hsl(45_30%_90%)]">
              Vault
            </h1>
            <p className="mt-2 text-[hsl(0_0%_60%)]">
              Secure access to financials, HR documents, and client database.
            </p>

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
