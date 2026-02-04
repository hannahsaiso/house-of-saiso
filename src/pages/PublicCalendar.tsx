import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fetchPublicCalendar } from "@/hooks/usePublicCalendarToken";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PublicBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_type: string;
  status: string | null;
  is_blocked: boolean;
}

const PublicCalendar = () => {
  const { token } = useParams<{ token: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<PublicBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCalendar = async () => {
      if (!token) {
        setError("Invalid calendar link");
        setIsLoading(false);
        return;
      }

      const result = await fetchPublicCalendar(token);
      if (!result.valid) {
        setError(result.error || "Invalid or expired link");
      } else {
        setBookings(result.bookings as PublicBooking[]);
      }
      setIsLoading(false);
    };

    loadCalendar();
  }, [token]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDayOfWeek - i));
    return date;
  });

  const allDays = [...paddingDays, ...days];

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => b.date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Calendar Unavailable
          </h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-editorial text-muted-foreground">
              Studio Availability
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              House of Saiso
            </h1>
          </div>

          {/* Month Navigation */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-heading text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-lg border border-border bg-card">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-editorial text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7">
              {allDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const dayBookings = getBookingsForDate(day);
                const isBooked = dayBookings.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border p-2",
                      !isCurrentMonth && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                          !isCurrentMonth && "text-muted-foreground",
                          isToday && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>

                    {/* Availability Indicator */}
                    {isCurrentMonth && (
                      <div className="mt-2">
                        {isBooked ? (
                          <div className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                            Booked
                          </div>
                        ) : (
                          <div className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                            Available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-100" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-destructive/10" />
              <span>Booked</span>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Interested in booking?{" "}
              <a
                href="mailto:studio@houseofsaiso.com"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Contact us
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicCalendar;
