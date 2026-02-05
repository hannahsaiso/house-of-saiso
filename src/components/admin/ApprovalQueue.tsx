import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageSquare, User, Clock, Loader2, Eye, ThumbsUp, Edit3 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApprovalQueue, ReviewTask } from "@/hooks/useApprovalQueue";
import { formatDistanceToNow } from "date-fns";
import { TaskCardSkeleton } from "@/components/ui/skeleton-loaders";

export function ApprovalQueue() {
  const { reviewTasks, isLoading, approveTask, addFeedback } = useApprovalQueue();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [quickFeedbackTaskId, setQuickFeedbackTaskId] = useState<string | null>(null);
  const [quickFeedbackText, setQuickFeedbackText] = useState("");

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

  const handleQuickFeedback = (taskId: string) => {
    if (quickFeedbackText.trim()) {
      addFeedback.mutate({ taskId, feedback: quickFeedbackText });
      setQuickFeedbackTaskId(null);
      setQuickFeedbackText("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Needs Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
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
                      {/* Quick Preview Note */}
                      {task.description && (
                        <div className="mt-2 rounded bg-muted/30 px-2 py-1.5">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {/* Looks Great - One Click to Done */}
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 flex-1 gap-1 text-xs bg-primary/90 hover:bg-primary"
                        onClick={() => handleApprove(task.id)}
                        disabled={approveTask.isPending}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Looks Great
                      </Button>
                      
                      {/* Needs Edit - Inline Quick Feedback */}
                      <Popover 
                        open={quickFeedbackTaskId === task.id} 
                        onOpenChange={(open) => {
                          if (open) {
                            setQuickFeedbackTaskId(task.id);
                            setQuickFeedbackText("");
                          } else {
                            setQuickFeedbackTaskId(null);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 gap-1 text-xs"
                          >
                            <Edit3 className="h-3 w-3" />
                            Needs Edit
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="end">
                          <Textarea
                            placeholder="Quick feedback..."
                            value={quickFeedbackText}
                            onChange={(e) => setQuickFeedbackText(e.target.value)}
                            rows={2}
                            className="mb-2 text-sm"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 text-xs"
                              onClick={() => setQuickFeedbackTaskId(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => handleQuickFeedback(task.id)}
                              disabled={!quickFeedbackText.trim() || addFeedback.isPending}
                            >
                              Send
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
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
