import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CommandBar } from "@/components/command/CommandBar";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Studio from "./pages/Studio";
import Vault from "./pages/Vault";
import PublicCalendar from "./pages/PublicCalendar";
import Onboarding from "./pages/Onboarding";
import ClientIntake from "./pages/ClientIntake";
import Settings from "./pages/Settings";
import Integrations from "./pages/settings/Integrations";
import IntegrationsCallback from "./pages/settings/IntegrationsCallback";
import ProfileSettings from "./pages/settings/ProfileSettings";
import TeamManagement from "./pages/settings/TeamManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import UnifiedCalendar from "./pages/Calendar";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import Inbox from "./pages/Inbox";
import Drive from "./pages/Drive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandBar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/calendar" element={<UnifiedCalendar />} />
            <Route path="/calendar/:token" element={<PublicCalendar />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/drive" element={<Drive />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/intake/:projectId" element={<ClientIntake />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/settings" element={<Settings />}>
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="integrations/callback" element={<IntegrationsCallback />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
