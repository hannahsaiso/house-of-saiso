import { LayoutDashboard, FolderKanban, Calendar, Lock, ChevronLeft, ChevronRight, Settings, Crown, CalendarDays, Package, Mail, HardDrive, ChevronDown, Users, DollarSign, Share2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShareOnboardingDialog } from "@/components/admin/ShareOnboardingDialog";
import { GlobalClock } from "./GlobalClock";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  adminOrStaffOnly?: boolean;
  group: "work" | "studio" | "operations" | "admin";
  showConnectionStatus?: boolean;
}

const navItems: NavItem[] = [
  // WORK Group
  { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "work" },
  { title: "Projects", url: "/projects", icon: FolderKanban, group: "work" },
  { title: "Calendar", url: "/calendar", icon: CalendarDays, group: "work" },
  // STUDIO Group
  { title: "Studio", url: "/studio", icon: Calendar, group: "studio" },
  { title: "Inventory", url: "/inventory", icon: Package, adminOrStaffOnly: true, group: "studio" },
  { title: "Drive", url: "/drive", icon: HardDrive, adminOrStaffOnly: true, group: "studio" },
  // OPERATIONS Group (Admin/Staff)
  { title: "Mail", url: "/inbox", icon: Mail, adminOrStaffOnly: true, group: "operations", showConnectionStatus: true },
  { title: "Settings", url: "/settings/profile", icon: Settings, group: "operations" },
  // ADMIN Group (Admin Only - strictly hidden from Staff)
  { title: "Executive", url: "/admin/dashboard", icon: Crown, adminOnly: true, group: "admin" },
  { title: "Financials", url: "/vault", icon: DollarSign, adminOnly: true, group: "admin" },
  { title: "Team", url: "/settings/team", icon: Users, adminOnly: true, group: "admin" },
];

interface NavGroupProps {
  label: string;
  number: string;
  items: NavItem[];
  collapsed: boolean;
  currentPath: string;
  isAdmin: boolean;
  isAdminOrStaff: boolean;
}

function NavGroup({ label, number, items, collapsed, currentPath, isAdmin, isAdminOrStaff }: NavGroupProps) {
  const filteredItems = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.adminOrStaffOnly && !isAdminOrStaff) return false;
    return true;
  });

  const hasActiveItem = filteredItems.some((item) => currentPath === item.url);
  
  // Contextual dimming logic
  const isStudioSection = label === "Studio";
  const isWorkSection = label === "Work";
  const isInStudioRoute = currentPath === "/studio" || currentPath === "/inventory";
  const isInWorkRoute = currentPath === "/projects" || currentPath === "/" || currentPath.startsWith("/admin");
  
  // Dim Work when in Studio routes, dim Studio when in Work routes
  const isDimmed = (isStudioSection && isInWorkRoute) || (isWorkSection && isInStudioRoute);
  
  const [isOpen, setIsOpen] = useState(hasActiveItem ? true : !isDimmed);

  if (filteredItems.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("group/collapsible", isDimmed && "opacity-50")}>
      {!collapsed && (
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent/50 rounded-sm transition-colors">
          <span className="font-heading text-[10px] font-medium uppercase tracking-editorial text-sidebar-foreground/40">
            <span className="text-sidebar-primary/60">{number}</span> {label}
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 text-sidebar-foreground/30 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
      )}
      <CollapsibleContent className="space-y-0.5">
        <SidebarMenu className="space-y-0.5">
          {filteredItems.map((item) => {
            const isActive = currentPath === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={collapsed ? item.title : undefined}
                >
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 font-heading text-[11px] font-medium tracking-widest transition-all duration-200",
                      "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-primary"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 stroke-[1.5]",
                        isActive && "text-sidebar-primary"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span>{item.title}</span>
                        {item.showConnectionStatus && <GoogleConnectionStatus />}
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, isAdminOrStaff, isLoading } = useUserRole();

  const workItems = navItems.filter((item) => item.group === "work");
  const studioItems = navItems.filter((item) => item.group === "studio");
  const operationsItems = navItems.filter((item) => item.group === "operations");
  const adminItems = navItems.filter((item) => item.group === "admin");

  return (
    <Sidebar
      className={cn(
        "border-r-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Logo / Brand */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <>
              <h1 className="font-heading text-lg font-semibold tracking-wide-xl text-sidebar-foreground">
                HOUSE OF SAISO
              </h1>
              <GlobalClock />
            </>
          ) : (
            <span className="font-heading text-xl font-bold text-sidebar-primary">
              HS
            </span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        <div className="space-y-4">
          <NavGroup 
            label="Work" 
            number="01" 
            items={workItems} 
            collapsed={collapsed}
            currentPath={location.pathname}
            isAdmin={isAdmin}
            isAdminOrStaff={isAdminOrStaff}
          />
          <NavGroup 
            label="Studio" 
            number="02" 
            items={studioItems} 
            collapsed={collapsed}
            currentPath={location.pathname}
            isAdmin={isAdmin}
            isAdminOrStaff={isAdminOrStaff}
          />
          <NavGroup 
            label="Operations" 
            number="03" 
            items={operationsItems} 
            collapsed={collapsed}
            currentPath={location.pathname}
            isAdmin={isAdmin}
            isAdminOrStaff={isAdminOrStaff}
          />
          
          {/* ADMIN Section - Strictly Admin Only */}
          {isAdmin && (
            <Collapsible defaultOpen className="group/collapsible">
              {!collapsed && (
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent/50 rounded-sm transition-colors">
                  <span className="font-heading text-[10px] font-medium uppercase tracking-editorial text-sidebar-foreground/40">
                    <span className="text-sidebar-primary/60">04</span> Admin
                  </span>
                  <ChevronDown className={cn(
                    "h-3 w-3 text-sidebar-foreground/30 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                  )} />
                </CollapsibleTrigger>
              )}
              <CollapsibleContent className="space-y-0.5">
                <SidebarMenu className="space-y-0.5">
                  {adminItems.map((item) => {
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
                              "flex items-center gap-3 rounded-sm px-3 py-2.5 font-heading text-[11px] font-medium tracking-widest transition-all duration-200",
                              "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                              isActive && "bg-sidebar-accent text-sidebar-primary"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0 stroke-[1.5]",
                                isActive && "text-sidebar-primary"
                              )}
                            />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {/* Share Onboarding Button */}
                  <SidebarMenuItem>
                    <ShareOnboardingDialog
                      trigger={
                        <SidebarMenuButton
                          tooltip={collapsed ? "Share Onboarding" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-sm px-3 py-2.5 font-heading text-[11px] font-medium tracking-widest transition-all duration-200 cursor-pointer w-full",
                            "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <Share2 className="h-4 w-4 shrink-0 stroke-[1.5]" />
                          {!collapsed && <span>Share Onboarding</span>}
                        </SidebarMenuButton>
                      }
                    />
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

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
