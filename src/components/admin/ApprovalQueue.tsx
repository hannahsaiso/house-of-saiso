import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageSquare, User, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApprovalQueue, ReviewTask } from "@/hooks/useApprovalQueue";
import { formatDistanceToNow } from "date-fns";

export function ApprovalQueue() {
  const { reviewTasks, isLoading, approveTask, addFeedback } = useApprovalQueue();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const handleApprove = (taskId: string) => {
    approveTask.mutate(taskId);
  };

  const handleOpenFeedback = (task: ReviewTask) => {
    setSelectedTask(task);
    setFeedbackText("");
    setFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = () => {
    if (selectedTask && feedbackText.trim()) {
      addFeedback.mutate({ taskId: selectedTask.id, feedback: feedbackText });
      setFeedbackDialogOpen(false);
      setSelectedTask(null);
      setFeedbackText("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Needs Review</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between font-heading text-lg">
            <span>Needs Review</span>
            {reviewTasks.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {reviewTasks.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tasks awaiting review
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {reviewTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.assignee?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {task.assignee?.full_name?.charAt(0) || <User className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.project?.title} • {task.assignee?.full_name || "Unassigned"}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 gap-1 text-xs"
                        onClick={() => handleApprove(task.id)}
                        disabled={approveTask.isPending}
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 flex-1 gap-1 text-xs"
                        onClick={() => handleOpenFeedback(task)}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Feedback
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{selectedTask?.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedTask?.project?.title} • {selectedTask?.assignee?.full_name}
              </p>
            </div>
            <Textarea
              placeholder="Provide feedback or revision notes..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              disabled={!feedbackText.trim() || addFeedback.isPending}
            >
              {addFeedback.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
