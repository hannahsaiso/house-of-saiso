import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StudioBookingCard } from "@/components/dashboard/StudioBookingCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { OnboardingQueue } from "@/components/dashboard/OnboardingQueue";
import { PendingSignaturesWidget } from "@/components/dashboard/PendingSignaturesWidget";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";

// Mock data - will be replaced with Supabase queries
const mockProjects = [
  {
    id: "1",
    title: "Brand Refresh Campaign",
    client: "Lumina Beauty",
    status: "active" as const,
    taskCount: 12,
    dueDate: "Jan 15",
  },
  {
    id: "2",
    title: "Social Media Strategy",
    client: "Terra Wellness",
    status: "review" as const,
    taskCount: 8,
    dueDate: "Jan 20",
  },
  {
    id: "3",
    title: "E-commerce Launch",
    client: "Artisan Collective",
    status: "active" as const,
    taskCount: 24,
    dueDate: "Feb 1",
  },
];

const mockBookings = [
  {
    id: "1",
    date: "2025-01-10",
    time: "10:00 AM - 2:00 PM",
    type: "Product Photography",
    clientName: "Lumina Beauty",
  },
  {
    id: "2",
    date: "2025-01-12",
    time: "9:00 AM - 5:00 PM",
    type: "Full Day Rental",
    clientName: "Fashion Forward",
  },
  {
    id: "3",
    date: "2025-01-15",
    time: "All Day",
    type: "Equipment Maintenance",
    isBlocked: true,
  },
];

const Index = () => {
  const { role, isAdminOrStaff, isLoading: roleLoading } = useUserRole();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <DashboardHeader userRole={role || "admin"} />

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
              <button className="text-xs font-medium uppercase tracking-editorial text-muted-foreground transition-colors hover:text-foreground">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {mockProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  client={project.client}
                  status={project.status}
                  taskCount={project.taskCount}
                  dueDate={project.dueDate}
                  index={index}
                />
              ))}
            </div>
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
              <button className="text-xs font-medium uppercase tracking-editorial text-muted-foreground transition-colors hover:text-foreground">
                View Calendar
              </button>
            </div>
            <div className="space-y-4">
              {mockBookings.map((booking, index) => (
                <StudioBookingCard
                  key={booking.id}
                  date={booking.date}
                  time={booking.time}
                  type={booking.type}
                  clientName={booking.clientName}
                  isBlocked={booking.isBlocked}
                  index={index}
                />
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
