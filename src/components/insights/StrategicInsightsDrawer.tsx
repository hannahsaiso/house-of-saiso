import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  X, 
  TrendingDown, 
  Clock, 
  Target, 
  Sparkles,
  Mail,
  CalendarCheck,
  PhoneCall,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "momentum" | "opportunity" | "warning" | "suggestion";
  title: string;
  description: string;
  projectId?: string;
  clientName?: string;
  createdAt: Date;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface StrategicInsightsDrawerProps {
  insights?: Insight[];
  className?: string;
}

export function StrategicInsightsDrawer({ insights = [], className }: StrategicInsightsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "momentum":
        return TrendingDown;
      case "opportunity":
        return Target;
      case "warning":
        return Clock;
      case "suggestion":
        return Sparkles;
      default:
        return Lightbulb;
    }
  };

  const getInsightColor = (type: Insight["type"]) => {
    switch (type) {
      case "momentum":
        return "text-amber-600 bg-amber-500/10 border-amber-500/30";
      case "opportunity":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "warning":
        return "text-destructive bg-destructive/10 border-destructive/30";
      case "suggestion":
        return "text-primary bg-primary/10 border-primary/30";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getQuickActions = (insight: Insight): QuickAction[] => {
    switch (insight.type) {
      case "momentum":
        return [
          {
            label: "Draft Check-in Email",
            icon: Mail,
            action: () => {
              // Navigate to inbox with pre-filled draft context
              const subject = encodeURIComponent(`Project Check-in: ${insight.clientName || "Your Project"}`);
              navigate(`/inbox?compose=true&subject=${subject}&projectId=${insight.projectId || ""}`);
              setIsOpen(false);
            },
          },
          {
            label: "Schedule Call",
            icon: PhoneCall,
            action: () => {
              navigate(`/studio?newBooking=true&type=internal&note=Check-in with ${insight.clientName || "client"}`);
              setIsOpen(false);
            },
          },
        ];
      case "warning":
        return [
          {
            label: "View Overdue Tasks",
            icon: AlertTriangle,
            action: () => {
              navigate("/projects?filter=overdue");
              setIsOpen(false);
            },
          },
        ];
      case "opportunity":
        return [
          {
            label: "Send Re-Engagement Email",
            icon: Mail,
            action: () => {
              const subject = encodeURIComponent("We'd Love to Work Together Again!");
              navigate(`/inbox?compose=true&subject=${subject}`);
              setIsOpen(false);
            },
          },
          {
            label: "Schedule Follow-up",
            icon: CalendarCheck,
            action: () => {
              navigate("/studio?newBooking=true&type=internal&note=Client re-engagement follow-up");
              setIsOpen(false);
            },
          },
        ];
      case "suggestion":
        return [
          {
            label: "View Projects",
            icon: Target,
            action: () => {
              navigate("/projects");
              setIsOpen(false);
            },
          },
        ];
      default:
        return [];
    }
  };

  const hasActiveInsights = insights.length > 0;
  const hasHighPriority = insights.some(i => i.type === "warning");

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-card border border-border/50 hover:bg-muted hover:shadow-xl",
          hasActiveInsights && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
          className
        )}
      >
        <Lightbulb className={cn(
          "h-5 w-5 transition-colors",
          hasActiveInsights ? "text-primary" : "text-muted-foreground",
          hasHighPriority && "animate-pulse"
        )} />
        {hasActiveInsights && (
          <span className={cn(
            "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
            hasHighPriority 
              ? "bg-destructive text-destructive-foreground animate-pulse" 
              : "bg-primary text-primary-foreground"
          )}>
            {insights.length}
          </span>
        )}
      </Button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border/50 bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading text-sm font-semibold tracking-wide">
                      Strategic Insights
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      AI-powered recommendations
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="p-6 space-y-4">
                  {insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-heading text-sm font-medium text-muted-foreground">
                        No active insights
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        AI insights will appear here when detected
                      </p>
                    </div>
                  ) : (
                    insights.map((insight, index) => {
                      const Icon = getInsightIcon(insight.type);
                      const colorClasses = getInsightColor(insight.type);
                      const quickActions = getQuickActions(insight);
                      
                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                            colorClasses
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-heading text-sm font-medium">
                                  {insight.title}
                                </h3>
                                {insight.clientName && (
                                  <Badge variant="outline" className="text-[9px] h-4">
                                    {insight.clientName}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs opacity-80 leading-relaxed">
                                {insight.description}
                              </p>
                              
                              {/* Quick Actions */}
                              {quickActions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {quickActions.map((action, actionIndex) => (
                                    <Button
                                      key={actionIndex}
                                      variant="secondary"
                                      size="sm"
                                      onClick={action.action}
                                      className="h-7 gap-1.5 text-xs bg-background/80 hover:bg-background"
                                    >
                                      <action.icon className="h-3 w-3" />
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {insights.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">
                          Powered by Gemini AI
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
