import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Plus,
  Clock,
  ChevronRight,
  MessageSquare,
  Loader2,
  Filter,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  parseISO,
  isBefore,
  isAfter,
} from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { useStaffProfiles } from "@/hooks/useStaffProfiles";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  internal_notes: string | null;
  shared_notes: string | null;
  created_at: string;
  project_id: string;
}

interface TemporalWorkflowProps {
  projectId: string;
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  review: { label: "Review", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  done: { label: "Done", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const priorityConfig = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-green-500",
};

export function TemporalWorkflow({ projectId }: TemporalWorkflowProps) {
  const queryClient = useQueryClient();
  const { isAdminOrStaff, isLoading: roleLoading } = useUserRole();
  const { profiles: staffProfiles } = useStaffProfiles();
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["project-tasks-temporal", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .neq("status", "done")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks-temporal", projectId] });
    },
  });

  const updateTaskAssignee = useMutation({
    mutationFn: async ({ taskId, assignedTo }: { taskId: string; assignedTo: string | null }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: assignedTo })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks-temporal", projectId] });
    },
  });

  // Filter and group tasks
  const groupedTasks = useMemo(() => {
    if (!tasks) return { thisWeek: [], nextWeek: [], upcoming: [], overdue: [] };

    let filteredTasks = tasks;
    if (myTasksOnly && currentUser) {
      filteredTasks = tasks.filter((t) => t.assigned_to === currentUser.id);
    }

    const thisWeek: Task[] = [];
    const nextWeek: Task[] = [];
    const upcoming: Task[] = [];
    const overdue: Task[] = [];

    filteredTasks.forEach((task) => {
      if (!task.due_date) {
        upcoming.push(task);
        return;
      }

      const dueDate = parseISO(task.due_date);

      if (isBefore(dueDate, thisWeekStart)) {
        overdue.push(task);
      } else if (isWithinInterval(dueDate, { start: thisWeekStart, end: thisWeekEnd })) {
        thisWeek.push(task);
      } else if (isWithinInterval(dueDate, { start: nextWeekStart, end: nextWeekEnd })) {
        nextWeek.push(task);
      } else if (isAfter(dueDate, nextWeekEnd)) {
        upcoming.push(task);
      }
    });

    return { thisWeek, nextWeek, upcoming, overdue };
  }, [tasks, myTasksOnly, currentUser, thisWeekStart, thisWeekEnd, nextWeekStart, nextWeekEnd]);

  const getAssignee = (userId: string | null) => {
    if (!userId) return null;
    return staffProfiles.find((p) => p.user_id === userId);
  };

  const getAssigneeInitials = (userId: string | null) => {
    const profile = getAssignee(userId);
    if (!profile) return "?";
    return profile.full_name?.split(" ").map((n) => n[0]).join("") || "?";
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const assignee = getAssignee(task.assigned_to);

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group rounded-md border border-l-4 bg-card p-4 transition-all hover:shadow-sm ${
          priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium
        }`}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={() =>
              updateTaskStatus.mutate({
                taskId: task.id,
                status: task.status === "done" ? "todo" : "done",
              })
            }
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{task.title}</p>
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] ${
                  statusConfig[task.status as keyof typeof statusConfig]?.color || statusConfig.todo.color
                }`}
              >
                {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
              </Badge>
            </div>

            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              {/* Assignee with avatar and name */}
              <div className="flex items-center gap-2">
                {isAdminOrStaff ? (
                  <Select
                    value={task.assigned_to || "unassigned"}
                    onValueChange={(value) =>
                      updateTaskAssignee.mutate({
                        taskId: task.id,
                        assignedTo: value === "unassigned" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-auto gap-2 border-0 bg-transparent p-0 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {assignee?.avatar_url && (
                            <AvatarImage src={assignee.avatar_url} alt={assignee.full_name} />
                          )}
                          <AvatarFallback className="text-[10px] bg-primary/10">
                            {getAssigneeInitials(task.assigned_to)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {assignee?.full_name || "Unassigned"}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background border">
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">?</AvatarFallback>
                          </Avatar>
                          <span>Unassigned</span>
                        </div>
                      </SelectItem>
                      {staffProfiles.map((profile) => (
                        <SelectItem key={profile.user_id || profile.id} value={profile.user_id || profile.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {profile.avatar_url && (
                                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {profile.full_name?.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profile.full_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {assignee?.avatar_url && (
                        <AvatarImage src={assignee.avatar_url} alt={assignee.full_name} />
                      )}
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {getAssigneeInitials(task.assigned_to)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {assignee?.full_name || "Unassigned"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {task.due_date && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(task.due_date), "EEE, MMM d")}
                  </span>
                )}
                {task.shared_notes && (
                  <Tooltip>
                    <TooltipTrigger>
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">{task.shared_notes}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Internal notes - Admin/Staff only */}
            {isAdminOrStaff && task.internal_notes && (
              <div className="mt-2 rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                <span className="font-medium">Internal: </span>
                {task.internal_notes}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const TaskSection = ({
    title,
    tasks,
    accentColor,
    icon,
  }: {
    title: string;
    tasks: Task[];
    accentColor: string;
    icon?: React.ReactNode;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${accentColor}`} />
          <h4 className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            {title}
          </h4>
          <span className="text-xs text-muted-foreground">({tasks.length})</span>
        </div>
        {icon}
      </div>
      {tasks.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No tasks scheduled
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Monday at a Glance</h3>
          <p className="text-sm text-muted-foreground">
            Temporal task view • Week of {format(thisWeekStart, "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* My Tasks Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="my-tasks"
              checked={myTasksOnly}
              onCheckedChange={setMyTasksOnly}
            />
            <Label htmlFor="my-tasks" className="text-sm text-muted-foreground cursor-pointer">
              My Tasks
            </Label>
          </div>

          {isAdminOrStaff && (
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Overdue Section */}
      {groupedTasks.overdue.length > 0 && (
        <TaskSection
          title="Overdue"
          tasks={groupedTasks.overdue}
          accentColor="bg-red-500"
        />
      )}

      {/* This Week */}
      <TaskSection
        title="This Week"
        tasks={groupedTasks.thisWeek}
        accentColor="bg-primary"
      />

      {/* Next Week */}
      <TaskSection
        title="Next Week"
        tasks={groupedTasks.nextWeek}
        accentColor="bg-amber-500"
      />

      {/* Upcoming */}
      <TaskSection
        title="Upcoming"
        tasks={groupedTasks.upcoming}
        accentColor="bg-muted-foreground"
        icon={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
      />

      {/* Summary */}
      {tasks && tasks.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {tasks.length} open tasks • {groupedTasks.overdue.length} overdue
              </span>
              <span className="text-muted-foreground">
                {groupedTasks.thisWeek.length} due this week
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
