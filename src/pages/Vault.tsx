import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const Vault = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-primary" />
          <p className="text-xs font-medium uppercase tracking-editorial text-muted-foreground">
            Admin Only
          </p>
        </div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Vault
        </h1>
        <p className="mt-2 text-muted-foreground">
          Secure access to financials, HR documents, and client database.
        </p>

        {/* Placeholder for vault sections */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {["Financials", "HR Documents", "Client Database"].map((section) => (
            <div
              key={section}
              className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border"
            >
              <p className="text-sm text-muted-foreground">{section}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Vault;
