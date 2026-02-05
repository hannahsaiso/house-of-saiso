import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from "date-fns";
 import { isBefore, startOfDay } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { useStaffProfiles } from "@/hooks/useStaffProfiles";
 import { cn } from "@/lib/utils";

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
}

interface WeeklyWorkflowProps {
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

export function WeeklyWorkflow({ projectId }: WeeklyWorkflowProps) {
  const queryClient = useQueryClient();
  const { isAdminOrStaff, isLoading: roleLoading } = useUserRole();
  const { profiles: staffProfiles } = useStaffProfiles();
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["project-tasks-workflow", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
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
      queryClient.invalidateQueries({ queryKey: ["project-tasks-workflow", projectId] });
    },
  });

  // Filter tasks for current week
  const weekTasks = tasks?.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = parseISO(task.due_date);
    return isWithinInterval(dueDate, { start: currentWeekStart, end: currentWeekEnd });
  }) || [];

  // Group by status
  const groupedTasks = {
    todo: weekTasks.filter((t) => t.status === "todo"),
    in_progress: weekTasks.filter((t) => t.status === "in_progress"),
    review: weekTasks.filter((t) => t.status === "review"),
    done: weekTasks.filter((t) => t.status === "done"),
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const profile = staffProfiles.find((p) => p.user_id === userId);
    return profile?.full_name || "Unknown";
  };

  const getAssigneeInitials = (userId: string | null) => {
    if (!userId) return "?";
    const profile = staffProfiles.find((p) => p.user_id === userId);
    return profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?";
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-md border border-l-4 bg-card p-3 transition-all hover:shadow-sm ${
        priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={() =>
              updateTaskStatus.mutate({
                taskId: task.id,
                status: task.status === "done" ? "todo" : "done",
              })
            }
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-[10px]">
                {getAssigneeInitials(task.assigned_to)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="top">
            {getAssigneeName(task.assigned_to)}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {task.due_date && (
           <span className={cn(
             "flex items-center gap-1 text-[10px]",
             isBefore(parseISO(task.due_date), startOfDay(new Date())) && task.status !== "done"
               ? "text-[hsl(var(--vault-warning))]"
               : "text-muted-foreground"
           )}>
            <Clock className="h-3 w-3" />
            {format(parseISO(task.due_date), "EEE d")}
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

      {/* Internal notes - Admin/Staff only */}
      {isAdminOrStaff && task.internal_notes && (
        <div className="mt-2 rounded bg-muted/50 p-1.5 text-[10px] text-muted-foreground">
          <span className="font-medium">Internal: </span>
          {task.internal_notes}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Weekly Workflow</h3>
          <p className="text-sm text-muted-foreground">
            {format(currentWeekStart, "MMM d")} – {format(currentWeekEnd, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className={weekOffset === 0 ? "bg-primary/10" : ""}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isAdminOrStaff && (
            <Button size="sm" className="ml-2 gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Kanban-style columns */}
      <div className="grid gap-4 md:grid-cols-4">
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
          const config = statusConfig[status];
          const statusTasks = groupedTasks[status];

          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={config.color}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {statusTasks.length}
                </span>
              </div>
              <div className="min-h-[200px] space-y-2 rounded-lg border border-dashed border-border/50 p-2">
                {statusTasks.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  statusTasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All tasks summary */}
      {tasks && tasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {tasks.filter((t) => t.status === "done").length} of {tasks.length} tasks completed
              </span>
              <span className="text-muted-foreground">
                {weekTasks.length} due this week
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
