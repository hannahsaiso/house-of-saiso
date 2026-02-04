import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Circle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStudioBookings } from "@/hooks/useStudioBookings";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: "studio" | "project" | "task" | "google";
  color: string;
}

export default function UnifiedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { bookings, isLoading: bookingsLoading } = useStudioBookings(currentMonth);
  const { projects, isLoading: projectsLoading } = useProjects();

  // Fetch user tasks with due dates
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["user-tasks-calendar"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, due_date, status")
        .eq("assigned_to", user.user.id)
        .not("due_date", "is", null)
        .neq("status", "done");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch Google Calendar events (if connected)
  const { data: googleEvents, isLoading: googleLoading } = useQuery({
    queryKey: ["google-calendar-events", currentMonth.toISOString()],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Check if user has Google connected
      const { data: token } = await supabase
        .from("google_oauth_tokens")
        .select("id")
        .eq("user_id", user.user.id)
        .single();

      if (!token) return [];

      // Fetch from Google Calendar API via gateway
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      try {
        const response = await fetch(
          `https://gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events?timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        );

        if (!response.ok) return [];

        const data = await response.json();
        return (data.items || []).map((event: any) => ({
          id: event.id,
          title: event.summary || "Untitled",
          date: event.start?.date || event.start?.dateTime?.split("T")[0],
          startTime: event.start?.dateTime?.split("T")[1]?.substring(0, 5),
          endTime: event.end?.dateTime?.split("T")[1]?.substring(0, 5),
          type: "google" as const,
          color: "hsl(var(--muted-foreground))",
        }));
      } catch (e) {
        console.error("Failed to fetch Google Calendar events:", e);
        return [];
      }
    },
  });

  // Combine all events
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Studio bookings - Charcoal
    bookings.forEach((booking) => {
      events.push({
        id: booking.id,
        title: booking.event_name || booking.booking_type,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        type: "studio",
        color: "hsl(var(--foreground))",
      });
    });

    // Project milestones - Champagne
    projects?.forEach((project) => {
      if (project.due_date) {
        events.push({
          id: `project-${project.id}`,
          title: `📁 ${project.title}`,
          date: project.due_date,
          type: "project",
          color: "hsl(45 60% 60%)",
        });
      }
    });

    // Personal tasks - Primary
    tasks?.forEach((task) => {
      if (task.due_date) {
        events.push({
          id: `task-${task.id}`,
          title: `✓ ${task.title}`,
          date: task.due_date,
          type: "task",
          color: "hsl(var(--primary))",
        });
      }
    });

    // Google Calendar events - Light Grey
    googleEvents?.forEach((event: CalendarEvent) => {
      events.push(event);
    });

    return events;
  }, [bookings, projects, tasks, googleEvents]);

  const isLoading = bookingsLoading || projectsLoading || tasksLoading;

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return allEvents.filter((event) => isSameDay(parseISO(event.date), day));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Unified View
            </span>
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Horizon Calendar
          </h1>
          <p className="mt-2 text-muted-foreground">
            All your events in one place.
          </p>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-foreground text-foreground" />
            <span className="text-xs text-muted-foreground">Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-[hsl(45_60%_60%)] text-[hsl(45_60%_60%)]" />
            <span className="text-xs text-muted-foreground">Project</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs text-muted-foreground">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Google</span>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] border-b border-r p-2 ${
                        !isCurrentMonth ? "bg-muted/30" : ""
                      } ${index % 7 === 6 ? "border-r-0" : ""}`}
                    >
                      <div
                        className={`mb-1 text-sm ${
                          isToday
                            ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                            : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded px-1.5 py-0.5 text-[10px] leading-tight"
                            style={{
                              backgroundColor: `${event.color}15`,
                              color: event.color,
                            }}
                            title={event.title}
                          >
                            {event.startTime && (
                              <span className="font-medium">
                                {event.startTime.substring(0, 5)}{" "}
                              </span>
                            )}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
