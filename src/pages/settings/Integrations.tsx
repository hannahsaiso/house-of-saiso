import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Settings2 } from "lucide-react";
import { GoogleWorkspaceCard } from "@/components/settings/GoogleWorkspaceCard";
import { supabase } from "@/integrations/supabase/client";

const Integrations = () => {
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  // Check if Google OAuth is configured
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-oauth-config");
        if (error) throw error;
        setGoogleConfigured(data?.configured === true);
      } catch {
        setGoogleConfigured(false);
      }
    };
    checkConfig();
  }, []);

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

      {/* System Note - Google Integration Pending */}
      {googleConfigured === false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <Settings2 className="mt-0.5 h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              System Note: Google Integration Pending Setup
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables need to be configured before the Google Workspace integration can be used.
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <GoogleWorkspaceCard />
      </div>
    </motion.div>
  );
};

export default Integrations;
