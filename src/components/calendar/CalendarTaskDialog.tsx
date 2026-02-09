import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalendarTasks, CalendarTask } from "@/hooks/useCalendarTasks";
import { useProjects } from "@/hooks/useProjects";

interface CalendarTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CalendarTask | null;
  defaultDate?: Date | null;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function CalendarTaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
}: CalendarTaskDialogProps) {
  const { createTask, updateTask, deleteTask, markComplete } = useCalendarTasks();
  const { projects } = useProjects();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    project_id: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date || "",
        priority: task.priority,
        project_id: task.project_id,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        due_date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        priority: "medium",
        project_id: projects[0]?.id || "",
      });
    }
  }, [task, defaultDate, open, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.project_id) {
      return;
    }

    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          title: formData.title,
          description: formData.description || undefined,
          due_date: formData.due_date,
          priority: formData.priority,
        });
      } else {
        await createTask.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          due_date: formData.due_date,
          priority: formData.priority,
          project_id: formData.project_id,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleDelete = async () => {
    if (task && confirm("Are you sure you want to delete this task?")) {
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    }
  };

  const handleComplete = async () => {
    if (task) {
      await markComplete.mutateAsync(task.id);
      onOpenChange(false);
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {task ? "Edit Task" : "New Task"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Update the task details below."
              : "Create a new task for your calendar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) =>
                setFormData({ ...formData, project_id: value })
              }
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {task && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleComplete}
                  disabled={markComplete.isPending}
                  className="mr-auto"
                >
                  Mark Complete
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                >
                  Delete
                </Button>
              </>
            )}
            <Button type="submit" disabled={isSubmitting || !formData.project_id}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
