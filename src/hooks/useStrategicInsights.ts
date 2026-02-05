import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface Insight {
  id: string;
  type: "momentum" | "opportunity" | "warning" | "suggestion";
  title: string;
  description: string;
  projectId?: string;
  clientName?: string;
  createdAt: Date;
}

export function useStrategicInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdminOrStaff } = useUserRole();

  useEffect(() => {
    if (!isAdminOrStaff) {
      setIsLoading(false);
      return;
    }

    generateInsights();
  }, [isAdminOrStaff]);

  const generateInsights = async () => {
    setIsLoading(true);
    const generatedInsights: Insight[] = [];

    try {
      // Check for overdue tasks
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select(`
          id, title, due_date,
          project:projects(title, client:clients(name))
        `)
        .lt("due_date", new Date().toISOString().split("T")[0])
        .neq("status", "done")
        .limit(5);

      if (overdueTasks && overdueTasks.length > 0) {
        generatedInsights.push({
          id: "overdue-tasks",
          type: "warning",
          title: `${overdueTasks.length} Overdue Tasks`,
          description: `You have ${overdueTasks.length} tasks past their due date. Consider prioritizing these to maintain client satisfaction.`,
          createdAt: new Date(),
        });
      }

      // Check for projects without recent activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: staleProjects } = await supabase
        .from("projects")
        .select(`
          id, title, updated_at,
          client:clients(name)
        `)
        .eq("status", "active")
        .lt("updated_at", thirtyDaysAgo.toISOString())
        .limit(3);

      staleProjects?.forEach((project) => {
        const client = Array.isArray(project.client) ? project.client[0] : project.client;
        generatedInsights.push({
          id: `stale-${project.id}`,
          type: "momentum",
          title: "Low Momentum Detected",
          description: `"${project.title}" hasn't been updated in over 30 days. Consider reaching out to the client.`,
          projectId: project.id,
          clientName: client?.name,
          createdAt: new Date(),
        });
      });

      // Check for upcoming deadlines
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingDeadlines } = await supabase
        .from("projects")
        .select(`
          id, title, due_date,
          client:clients(name)
        `)
        .gte("due_date", new Date().toISOString().split("T")[0])
        .lte("due_date", nextWeek.toISOString().split("T")[0])
        .eq("status", "active")
        .limit(3);

      if (upcomingDeadlines && upcomingDeadlines.length > 0) {
        generatedInsights.push({
          id: "upcoming-deadlines",
          type: "suggestion",
          title: `${upcomingDeadlines.length} Deadlines This Week`,
          description: `Review progress on projects due within the next 7 days to ensure timely delivery.`,
          createdAt: new Date(),
        });
      }

      // Check for high-value clients without recent bookings
      const { data: topClients } = await supabase
        .from("financial_entries")
        .select("client_id, amount")
        .order("amount", { ascending: false })
        .limit(10);

      const topClientIds = [...new Set(topClients?.map((e) => e.client_id).filter(Boolean))] as string[];

      if (topClientIds.length > 0) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: recentBookings } = await supabase
          .from("studio_bookings")
          .select("client_id")
          .in("client_id", topClientIds)
          .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

        const clientsWithRecentBookings = new Set(recentBookings?.map((b) => b.client_id));
        const dormantTopClients = topClientIds.filter((id) => !clientsWithRecentBookings.has(id));

        if (dormantTopClients.length > 0) {
          generatedInsights.push({
            id: "dormant-top-clients",
            type: "opportunity",
            title: "Re-engagement Opportunity",
            description: `${dormantTopClients.length} high-value clients haven't booked in 6+ months. Consider outreach campaigns.`,
            createdAt: new Date(),
          });
        }
      }

      setInsights(generatedInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insights,
    isLoading,
    refreshInsights: generateInsights,
  };
}
