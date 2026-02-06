import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CommandBar } from "@/components/command/CommandBar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Auth from "./pages/Auth";
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
import JoinTeam from "./pages/JoinTeam";

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
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/calendar/:token" element={<PublicCalendar />} />
            <Route path="/intake/:projectId" element={<ClientIntake />} />
            <Route path="/join/:token" element={<JoinTeam />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><UnifiedCalendar /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/drive" element={<ProtectedRoute><Drive /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            
            {/* Admin-only routes */}
            <Route path="/vault" element={<AdminRoute><Vault /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            
            {/* Settings routes */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>}>
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="integrations/callback" element={<IntegrationsCallback />} />
            </Route>
            
            {/* Google OAuth callback - matches Google Cloud Console redirect URI */}
            <Route path="/auth/callback" element={<IntegrationsCallback />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
