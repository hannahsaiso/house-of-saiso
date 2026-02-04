import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStudioBookings, StudioBooking } from "@/hooks/useStudioBookings";
import { StudioEventDialog } from "./StudioEventDialog";
import { StudioEventCard } from "./StudioEventCard";
import { StudioSidebar } from "./StudioSidebar";
import { ShareCalendarDialog } from "./ShareCalendarDialog";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StudioCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<StudioBooking | null>(null);

  const { bookings, isLoading } = useStudioBookings(currentMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning with days from previous month
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

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleNewEvent = () => {
    setEditingBooking(null);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (booking: StudioBooking) => {
    setEditingBooking(booking);
    setIsEventDialogOpen(true);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Main Calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-heading text-2xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button size="sm" onClick={handleNewEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
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
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayBookings = getBookingsForDate(day);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={cn(
                    "min-h-[120px] border-b border-r border-border p-2 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isSelected && "bg-primary/5",
                    "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => handleDateClick(day)}
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

                  {/* Event Cards */}
                  <div className="mt-1 space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <StudioEventCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => handleEditEvent(booking)}
                        compact
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <StudioSidebar
        selectedDate={selectedDate}
        bookings={selectedDate ? getBookingsForDate(selectedDate) : []}
        onEditBooking={handleEditEvent}
        onNewBooking={() => {
          setEditingBooking(null);
          setIsEventDialogOpen(true);
        }}
      />

      {/* Dialogs */}
      <StudioEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        booking={editingBooking}
        defaultDate={selectedDate}
      />

      <ShareCalendarDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </div>
  );
}
