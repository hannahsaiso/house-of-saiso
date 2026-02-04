import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { StudioCalendar } from "@/components/studio/StudioCalendar";

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

        <div className="mt-8">
          <StudioCalendar />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Studio;
