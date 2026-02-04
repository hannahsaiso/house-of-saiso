import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, FileSignature, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  signature_sent: FileSignature,
  document_signed: FileSignature,
  asset_uploaded: Upload,
  default: Bell,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-heading text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              className="h-auto px-2 py-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || typeIcons.default;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex gap-3 p-4 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
