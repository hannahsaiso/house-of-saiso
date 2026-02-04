import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Studio from "./pages/Studio";
import Vault from "./pages/Vault";
import PublicCalendar from "./pages/PublicCalendar";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Integrations from "./pages/settings/Integrations";
import IntegrationsCallback from "./pages/settings/IntegrationsCallback";
import ProfileSettings from "./pages/settings/ProfileSettings";
import TeamManagement from "./pages/settings/TeamManagement";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/calendar/:token" element={<PublicCalendar />} />
          <Route path="/onboarding" element={<Onboarding />} />
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
  </QueryClientProvider>
);

export default App;
