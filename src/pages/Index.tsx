import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StudioBookingCard } from "@/components/dashboard/StudioBookingCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { OnboardingQueue } from "@/components/dashboard/OnboardingQueue";
import { PendingSignaturesWidget } from "@/components/dashboard/PendingSignaturesWidget";
import { StrategicInsightsDrawer } from "@/components/insights/StrategicInsightsDrawer";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useStrategicInsights } from "@/hooks/useStrategicInsights";
import { useProjects } from "@/hooks/useProjects";
import { useStudioBookings } from "@/hooks/useStudioBookings";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { role, isAdminOrStaff, isLoading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { insights } = useStrategicInsights();
  const { activeProjects, isLoading: projectsLoading } = useProjects();
  const { bookings, isLoading: bookingsLoading } = useStudioBookings();
  const navigate = useNavigate();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  // Get upcoming bookings (next 3 where date >= today)
  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings
    .filter((b) => b.date >= today && b.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 3);

  // Get top 3 active projects
  const displayProjects = activeProjects.slice(0, 3);

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects?id=${projectId}`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <DashboardHeader userName={userName} userRole={role || "admin"} />

        {/* Quick Actions */}
        <div className="mb-10">
          <QuickActions userRole={role || "admin"} />
        </div>

        {/* Onboarding Queue - Admin/Staff only */}
        {!roleLoading && isAdminOrStaff && <OnboardingQueue />}

        {/* Pending Signatures - Admin only */}
        {!roleLoading && isAdminOrStaff && (
          <div className="mb-10">
            <PendingSignaturesWidget />
          </div>
        )}

        {/* Dual Stream Layout */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Agency Projects Stream */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">
                Active Projects
              </h2>
              <div className="flex items-center gap-2">
                <NewProjectDialog
                  trigger={
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Button>
                  }
                />
                <button 
                  className="text-xs font-medium uppercase tracking-editorial text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => navigate("/projects")}
                >
                  View All
                </button>
              </div>
            </div>
            
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : displayProjects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">No active projects</p>
                  <NewProjectDialog
                    trigger={
                      <Button variant="outline" size="sm" className="mt-3 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Create Project
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    client={project.client?.name || "No Client"}
                    status={project.status as "active" | "review" | "completed" | "on_hold"}
                    taskCount={0}
                    dueDate={project.due_date ? format(new Date(project.due_date), "MMM d") : undefined}
                    index={index}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* Studio Bookings Stream */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">
                Upcoming Bookings
              </h2>
              <button 
                className="text-xs font-medium uppercase tracking-editorial text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => navigate("/studio")}
              >
                View Calendar
              </button>
            </div>
            
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No upcoming shoots</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate("/studio")}
                  >
                    Book Studio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking, index) => (
                  <StudioBookingCard
                    key={booking.id}
                    date={booking.date}
                    time={`${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`}
                    type={booking.event_name || booking.booking_type}
                    clientName={booking.client?.name}
                    isBlocked={booking.is_blocked}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* Strategic Insights Drawer - Admin/Staff only */}
      {!roleLoading && isAdminOrStaff && (
        <StrategicInsightsDrawer insights={insights} />
      )}
    </DashboardLayout>
  );
};

export default Index;
