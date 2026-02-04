import { motion } from "framer-motion";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: "admin" | "staff" | "client";
}

export function DashboardHeader({
  userName,
  userRole = "admin",
}: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "staff":
        return "Team Member";
      case "client":
        return "Client";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
        {getRoleLabel()}
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {getGreeting()}{userName ? `, ${userName}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Here's what's happening across your agency and studio.
      </p>
    </motion.div>
  );
}
