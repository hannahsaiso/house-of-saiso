import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  client: string;
  status: "active" | "review" | "completed";
  taskCount: number;
  dueDate?: string;
  index?: number;
}

export function ProjectCard({
  title,
  client,
  status,
  taskCount,
  dueDate,
  index = 0,
}: ProjectCardProps) {
  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-primary/10 text-primary border-primary/20",
    },
    review: {
      label: "In Review",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
  };

  const statusInfo = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="group cursor-pointer border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-editorial text-muted-foreground">
                {client}
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold">
                {title}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase tracking-wide", statusInfo.className)}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{taskCount} tasks</span>
            {dueDate && <span>Due {dueDate}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
