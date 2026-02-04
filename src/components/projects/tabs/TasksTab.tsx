import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Plus, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
}

interface TasksTabProps {
  projectId: string;
}

const priorityColors = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-green-500/10 text-green-600 border-green-500/20",
};

const statusColors = {
  todo: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  done: "bg-green-500/10 text-green-600 border-green-500/20",
};

export function TasksTab({ projectId }: TasksTabProps) {
  const queryClient = useQueryClient();
  const { isAdminOrStaff, isLoading: roleLoading } = useUserRole();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("priority", { ascending: true })
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
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
  });

  const toggleTaskComplete = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTaskStatus.mutate({ taskId: task.id, status: newStatus });
  };

  if (isLoading || roleLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const todoTasks = tasks?.filter((t) => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter((t) => t.status === "in_progress") || [];
  const doneTasks = tasks?.filter((t) => t.status === "done") || [];

  const TaskItem = ({ task }: { task: Task }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="transition-all hover:border-primary/30">
        <CardContent className="flex items-start gap-3 p-4">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={() => toggleTaskComplete(task)}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-medium ${
                  task.status === "done"
                    ? "text-muted-foreground line-through"
                    : ""
                }`}
              >
                {task.title}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    priorityColors[task.priority as keyof typeof priorityColors] ||
                    priorityColors.medium
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.due_date), "MMM d")}
                </span>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${
                  statusColors[task.status as keyof typeof statusColors] ||
                  statusColors.todo
                }`}
              >
                {task.status.replace("_", " ")}
              </Badge>
            </div>
            {/* Internal notes - only visible to admin/staff */}
            {isAdminOrStaff && task.internal_notes && (
              <div className="mt-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                <span className="font-medium">Internal: </span>
                {task.internal_notes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Tasks</h3>
          <p className="text-sm text-muted-foreground">
            {tasks?.length || 0} tasks • {doneTasks.length} completed
          </p>
        </div>
        {isAdminOrStaff && (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {!tasks || tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium">No tasks yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdminOrStaff
                ? "Create tasks to track project progress"
                : "Tasks will appear here as they're assigned"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* In Progress */}
          {inProgressTasks.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                In Progress ({inProgressTasks.length})
              </h4>
              <div className="space-y-2">
                {inProgressTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* To Do */}
          {todoTasks.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                To Do ({todoTasks.length})
              </h4>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {doneTasks.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Completed ({doneTasks.length})
              </h4>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
