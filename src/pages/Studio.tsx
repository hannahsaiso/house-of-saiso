import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";

const Studio = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
          Creative Space
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Studio Calendar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Book and manage studio space availability.
        </p>

        {/* Placeholder for calendar */}
        <div className="mt-10 flex min-h-[500px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Interactive calendar coming soon...
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Studio;
