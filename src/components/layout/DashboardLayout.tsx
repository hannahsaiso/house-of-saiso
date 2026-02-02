import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Mobile header with trigger */}
          <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <SidebarTrigger className="mr-4" />
            <span className="font-heading text-sm font-semibold tracking-wide-xl">
              HOUSE OF SAISO
            </span>
          </header>
          <div className="p-6 md:p-10">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
