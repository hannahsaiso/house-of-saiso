import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Outlet, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const settingsNav = [
  { label: "Integrations", href: "/settings/integrations" },
];

const Settings = () => {
  const location = useLocation();

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
            {settingsNav.map((item) => (
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
