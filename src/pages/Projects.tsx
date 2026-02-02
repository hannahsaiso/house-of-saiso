import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";

const Projects = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
          Agency
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Projects
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage client projects and workspaces.
        </p>

        {/* Placeholder for project list */}
        <div className="mt-10 flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Project workspaces coming soon...
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Projects;
