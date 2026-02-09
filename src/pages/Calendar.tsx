import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  RefreshCw,
  Package,
  Plus,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { CalendarTaskDialog } from "@/components/calendar/CalendarTaskDialog";
import { DailyBrief } from "@/components/calendar/DailyBrief";
import { useCalendarFilters } from "@/hooks/useCalendarFilters";
import { useCalendarTasks, CalendarTask } from "@/hooks/useCalendarTasks";
import { useStudioBookings } from "@/hooks/useStudioBookings";
import { useProjects } from "@/hooks/useProjects";
import { useInventoryReservations } from "@/hooks/useInventory";
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
  gearBlocked?: string[];
  color: string;
  rawTask?: CalendarTask;
}

// Google Calendar events are fetched client-side only (privacy-first approach)
const useGoogleCalendarEvents = (currentMonth: Date, enabled: boolean) => {
  return useQuery({
    queryKey: ["google-calendar-streaming", currentMonth.toISOString()],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data: tokenRecord } = await supabase
        .from("google_oauth_tokens")
        .select("id")
        .eq("user_id", session.session.user.id)
        .single();

      if (!tokenRecord) return [];

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      try {
        const response = await fetch(
          `https://gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events?timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          console.warn("Google Calendar fetch failed:", response.status);
          return [];
        }

        const data = await response.json();
        return (data.items || []).map((event: any) => ({
          id: `google-${event.id}`,
          title: event.summary || "Untitled",
          date: event.start?.date || event.start?.dateTime?.split("T")[0],
          startTime: event.start?.dateTime?.split("T")[1]?.substring(0, 5),
          endTime: event.end?.dateTime?.split("T")[1]?.substring(0, 5),
          type: "google" as const,
          color: "hsl(var(--muted-foreground))",
        }));
      } catch (e) {
        console.error("Failed to stream Google Calendar events:", e);
        return [];
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export default function UnifiedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  // Filter state with localStorage persistence
  const { filters, setFilters } = useCalendarFilters();

  // Data hooks
  const { bookings, isLoading: bookingsLoading } = useStudioBookings(currentMonth);
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks: calendarTasks, isLoading: calendarTasksLoading } = useCalendarTasks();

  // Gear reservations for the month
  const gearMonthStart = startOfMonth(currentMonth);
  const gearMonthEnd = endOfMonth(currentMonth);
  const { reservations: gearReservations } = useInventoryReservations(undefined, {
    from: format(gearMonthStart, "yyyy-MM-dd"),
    to: format(gearMonthEnd, "yyyy-MM-dd"),
  });

  // Check if user has Google connected
  const { data: hasGoogleConnection } = useQuery({
    queryKey: ["google-connection-check"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data } = await supabase
        .from("google_oauth_tokens")
        .select("id")
        .eq("user_id", user.user.id)
        .single();

      return !!data;
    },
  });

  // Privacy-first: Stream Google Calendar events directly to browser
  const {
    data: googleEvents,
    isLoading: googleLoading,
    refetch: refetchGoogle,
    isFetching: googleFetching,
  } = useGoogleCalendarEvents(currentMonth, !!hasGoogleConnection);

  // Google events for Daily Brief (filtered for selected date)
  const dailyBriefGoogleEvents = useMemo(() => {
    if (!googleEvents) return [];
    return googleEvents
      .filter((e) => e.date && isSameDay(parseISO(e.date), selectedDate))
      .map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
      }));
  }, [googleEvents, selectedDate]);

  // Combine all events with filtering
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Studio bookings - Charcoal (if filter enabled)
    if (filters.studio) {
      bookings.forEach((booking) => {
        events.push({
          id: booking.id,
          title: booking.event_name || booking.booking_type,
          date: booking.date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          type: "studio",
          color: "hsl(var(--foreground))",
          gearBlocked: gearReservations
            ?.filter((r) => r.booking_id === booking.id)
            .map((r) => r.inventory?.item_name || "Gear"),
        });
      });
    }

    // Project milestones - Champagne (if filter enabled)
    if (filters.projects) {
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
    }

    // Personal tasks - Primary (if filter enabled)
    if (filters.tasks) {
      calendarTasks?.forEach((task) => {
        if (task.due_date) {
          events.push({
            id: `task-${task.id}`,
            title: `✓ ${task.title}`,
            date: task.due_date,
            type: "task",
            color: "hsl(var(--primary))",
            rawTask: task,
          });
        }
      });
    }

    // Google Calendar events (if filter enabled)
    if (filters.google) {
      googleEvents?.forEach((event: CalendarEvent) => {
        events.push(event);
      });
    }

    return events;
  }, [bookings, projects, calendarTasks, googleEvents, gearReservations, filters]);

  const isLoading = bookingsLoading || projectsLoading || calendarTasksLoading;

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return allEvents.filter((event) => isSameDay(parseISO(event.date), day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleDayDoubleClick = (day: Date) => {
    setDialogDate(day);
    setSelectedTask(null);
    setTaskDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.type === "task" && event.rawTask) {
      setSelectedTask(event.rawTask);
      setDialogDate(null);
      setTaskDialogOpen(true);
    }
  };

  const handleTaskClickFromBrief = (task: CalendarTask) => {
    setSelectedTask(task);
    setDialogDate(null);
    setTaskDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Command Center
              </span>
            </div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">
              Horizon Calendar
            </h1>
            <p className="mt-2 text-muted-foreground">
              Click to select a date. Double-click to add a task.
            </p>
          </motion.div>

          {/* Filter Bar */}
          <CalendarFilters
            filters={filters}
            onFiltersChange={setFilters}
            hasGoogleConnection={!!hasGoogleConnection}
          />

          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setDialogDate(selectedDate);
                  setSelectedTask(null);
                  setTaskDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
              {hasGoogleConnection && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchGoogle()}
                  disabled={googleFetching}
                  title="Refresh Google Calendar"
                >
                  <RefreshCw className={`h-4 w-4 ${googleFetching ? "animate-spin" : ""}`} />
                </Button>
              )}
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
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        onDoubleClick={() => handleDayDoubleClick(day)}
                        className={`min-h-[100px] border-b border-r p-2 cursor-pointer transition-colors ${
                          !isCurrentMonth ? "bg-muted/30" : ""
                        } ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/50"} ${
                          index % 7 === 6 ? "border-r-0" : ""
                        }`}
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
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <Tooltip key={event.id}>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={(e) => handleEventClick(event, e)}
                                  className={`truncate rounded px-1 py-0.5 text-[9px] leading-tight ${
                                    event.type === "task" ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : "cursor-default"
                                  }`}
                                  style={{
                                    backgroundColor: `${event.color}15`,
                                    color: event.color,
                                  }}
                                >
                                  {event.type === "google" && (
                                    <span className="mr-0.5 opacity-60">G</span>
                                  )}
                                  {event.type === "task" && (
                                    <CheckSquare className="inline h-2 w-2 mr-0.5" />
                                  )}
                                  {event.gearBlocked && event.gearBlocked.length > 0 && (
                                    <Package className="inline h-2 w-2 mr-0.5 text-amber-500" />
                                  )}
                                  {event.startTime && (
                                    <span className="font-medium">
                                      {event.startTime.substring(0, 5)}{" "}
                                    </span>
                                  )}
                                  {event.title}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="font-medium">{event.title}</p>
                                {event.type === "google" && (
                                  <p className="text-xs text-muted-foreground">Google Calendar</p>
                                )}
                                {event.type === "task" && (
                                  <p className="text-xs text-muted-foreground">
                                    Click to edit task
                                  </p>
                                )}
                                {event.gearBlocked && event.gearBlocked.length > 0 && (
                                  <div className="mt-1 text-xs">
                                    <span className="text-amber-500 font-medium">Gear Blocked:</span>
                                    <ul className="list-disc list-inside">
                                      {event.gearBlocked.map((gear, i) => (
                                        <li key={i}>{gear}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[9px] text-muted-foreground">
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

          {/* Privacy Notice */}
          {hasGoogleConnection && filters.google && (
            <p className="text-center text-xs text-muted-foreground">
              Google Calendar events are streamed directly to your browser and are not stored in our database.
            </p>
          )}
        </div>

        {/* Daily Brief Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-72 flex-shrink-0 rounded-lg border border-border/50 bg-card overflow-hidden"
        >
          <DailyBrief
            selectedDate={selectedDate}
            studioBookings={bookings}
            googleEvents={dailyBriefGoogleEvents}
            tasks={calendarTasks}
            onTaskClick={handleTaskClickFromBrief}
          />
        </motion.div>
      </div>

      {/* Task Dialog */}
      <CalendarTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={selectedTask}
        defaultDate={dialogDate}
      />
    </DashboardLayout>
  );
}
