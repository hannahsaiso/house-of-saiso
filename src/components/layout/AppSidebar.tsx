 import { LayoutDashboard, FolderKanban, Calendar, Lock, ChevronLeft, ChevronRight, Settings, Crown, CalendarDays, Package, Mail } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { FinancialHealthWidget } from "./FinancialHealthWidget";
import { RevenuePulse } from "@/components/admin/RevenuePulse";
import { Separator } from "@/components/ui/separator";
 import { GoogleConnectionStatus } from "./GoogleConnectionStatus";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  adminOrStaffOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "DASHBOARD", url: "/", icon: LayoutDashboard },
  { title: "EXECUTIVE", url: "/admin/dashboard", icon: Crown, adminOnly: true },
   { title: "INBOX", url: "/inbox", icon: Mail, adminOrStaffOnly: true },
  { title: "CALENDAR", url: "/calendar", icon: CalendarDays },
  { title: "PROJECTS", url: "/projects", icon: FolderKanban },
  { title: "STUDIO", url: "/studio", icon: Calendar },
  { title: "INVENTORY", url: "/inventory", icon: Package, adminOrStaffOnly: true },
  { title: "VAULT", url: "/vault", icon: Lock, adminOrStaffOnly: true },
  { title: "SETTINGS", url: "/settings/integrations", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, isAdminOrStaff, isLoading } = useUserRole();

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.adminOrStaffOnly && !isAdminOrStaff) return false;
    return true;
  });

  return (
    <Sidebar
      className={cn(
        "border-r-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Logo / Brand */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-6">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="font-heading text-lg font-semibold tracking-wide-xl text-sidebar-foreground">
              HOUSE OF SAISO
            </h1>
          )}
          {collapsed && (
            <span className="font-heading text-xl font-bold text-sidebar-primary">
              HS
            </span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-sm px-3 py-3 text-xs font-medium tracking-editorial transition-all duration-200",
                          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isActive && "bg-sidebar-accent text-sidebar-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive && "text-sidebar-primary"
                          )}
                        />
                         {!collapsed && (
                           <div className="flex items-center justify-between flex-1">
                             <span>{item.title}</span>
                             {item.url === "/inbox" && <GoogleConnectionStatus />}
                           </div>
                         )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial Health Widget - Admin only */}
        {isAdmin && !collapsed && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4 px-3">
              <FinancialHealthWidget />
              <RevenuePulse />
            </div>
          </>
        )}
      </SidebarContent>

      {/* Collapse Toggle */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
