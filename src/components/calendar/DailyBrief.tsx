import { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Building2,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCalendarTasks, CalendarTask } from "@/hooks/useCalendarTasks";
import { useProjects } from "@/hooks/useProjects";
import { StudioBooking } from "@/hooks/useStudioBookings";
import { toast } from "sonner";

interface GoogleEvent {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
}

interface DailyBriefProps {
  selectedDate: Date;
  studioBookings: StudioBooking[];
  googleEvents: GoogleEvent[];
  tasks: CalendarTask[];
  onTaskClick?: (task: CalendarTask) => void;
}

export function DailyBrief({
  selectedDate,
  studioBookings,
  googleEvents,
  tasks,
  onTaskClick,
}: DailyBriefProps) {
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { createTask, markComplete } = useCalendarTasks();
  const { projects } = useProjects();

  // Filter data for selected date
  const dayBookings = studioBookings.filter((b) =>
    isSameDay(parseISO(b.date), selectedDate)
  );

  const dayGoogleEvents = googleEvents.filter((e) => {
    if (!e.startTime) return false;
    // Google events have date in the id format or we check the title
    return true; // Already filtered by parent
  });

  const dayTasks = tasks.filter(
    (t) => t.due_date && isSameDay(parseISO(t.due_date), selectedDate)
  );

  const isEmpty = dayBookings.length === 0 && dayGoogleEvents.length === 0 && dayTasks.length === 0;

  const handleQuickAdd = async () => {
    if (!quickTaskTitle.trim()) return;
    if (!projects.length) {
      toast.error("Create a project first to add tasks");
      return;
    }

    setIsAdding(true);
    try {
      await createTask.mutateAsync({
        title: quickTaskTitle.trim(),
        due_date: format(selectedDate, "yyyy-MM-dd"),
        project_id: projects[0].id,
        priority: "medium",
      });
      setQuickTaskTitle("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleTaskComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markComplete.mutateAsync(taskId);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const startHour = parseInt(start.substring(0, 2));
    const endHour = parseInt(end.substring(0, 2));
    const duration = endHour - startHour;
    return `${duration}h`;
  };

  return (
    <div className="flex h-full flex-col border-l border-border/50 bg-background/50">
      {/* Header */}
      <div className="border-b border-border/50 p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Daily Brief
        </p>
        <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">
          {format(selectedDate, "EEEE")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {format(selectedDate, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground italic">
                Your horizon is clear for today.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Studio Bookings */}
              {dayBookings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-foreground" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Studio
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-md border border-border/30 bg-muted/20 p-2.5"
                      >
                        <p className="text-sm font-medium truncate">
                          {booking.event_name || booking.booking_type}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                          </span>
                          {booking.client && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{booking.client.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Calendar */}
              {dayGoogleEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Google Calendar
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {dayGoogleEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md border border-border/30 bg-muted/20 p-2.5"
                      >
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        {event.startTime && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(event.startTime)}</span>
                            {event.endTime && (
                              <span className="text-muted-foreground/50">
                                ({formatDuration(event.startTime, event.endTime)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {dayTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Tasks
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="group flex items-start gap-2.5 rounded-md border border-border/30 bg-muted/20 p-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <button
                          onClick={(e) => handleTaskComplete(task.id, e)}
                          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          {task.project && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {task.project.title}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Quick add task..."
            value={quickTaskTitle}
            onChange={(e) => setQuickTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleQuickAdd();
              }
            }}
            className="h-9 text-sm bg-muted/30 border-border/50"
          />
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={!quickTaskTitle.trim() || isAdding}
            className="h-9 px-3"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
