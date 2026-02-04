import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useUserRole } from "@/hooks/useUserRole";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAdminOrStaff } = useUserRole();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Mobile header with trigger */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <span className="font-heading text-sm font-semibold tracking-wide-xl">
                HOUSE OF SAISO
              </span>
            </div>
            {isAdminOrStaff && <NotificationBell />}
          </header>
          
          {/* Desktop notification bell */}
          <div className="hidden md:flex justify-end px-6 pt-4">
            {isAdminOrStaff && <NotificationBell />}
          </div>
          
          <div className="p-6 md:p-10 md:pt-4">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
