import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Outlet, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const settingsNav = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Team", href: "/settings/team", adminOnly: true },
  { label: "Integrations", href: "/settings/integrations" },
];

const Settings = () => {
  const { isAdmin } = useUserRole();
  const location = useLocation();

  const filteredNav = settingsNav.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl"
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-editorial text-muted-foreground">
          Account
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Settings
        </h1>

        {/* Settings Navigation */}
        <nav className="mt-8 border-b border-border">
          <ul className="flex gap-8">
            {filteredNav.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "inline-block pb-4 text-sm font-medium tracking-wide transition-colors",
                    location.pathname === item.href
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Settings Content */}
        <div className="mt-10">
          <Outlet />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
