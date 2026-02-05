import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: "admin" | "staff" | "client";
}

export function DashboardHeader({
  userName,
  userRole = "admin",
}: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth", { replace: true });
  };

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
      className="mb-10 flex items-start justify-between"
    >
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
          {getRoleLabel()}
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {getGreeting()}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here's what's happening across your agency and studio.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
