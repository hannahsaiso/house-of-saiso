import { motion } from "framer-motion";
import { GoogleWorkspaceCard } from "@/components/settings/GoogleWorkspaceCard";

const Integrations = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-8"
    >
      <div>
        <h2 className="font-heading text-2xl font-medium tracking-tight">
          Integrations & Connectivity
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect external services to enhance your workflow.
        </p>
      </div>

      <div className="space-y-6">
        <GoogleWorkspaceCard />
      </div>
    </motion.div>
  );
};

export default Integrations;
