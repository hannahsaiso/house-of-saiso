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
    <div className="flex h-full flex-col gap-6 lg:flex-row">
      {/* Main Calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-heading text-xl font-semibold sm:text-2xl">
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
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button size="sm" onClick={handleNewEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Event</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid - Desktop */}
        <div className="hidden rounded-lg border border-border bg-card md:block">
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
                    "min-h-[100px] border-b border-r border-border p-2 transition-colors lg:min-h-[120px]",
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
                    {dayBookings.slice(0, 2).map((booking) => (
                      <StudioEventCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => handleEditEvent(booking)}
                        compact
                      />
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Calendar List - Mobile */}
        <div className="space-y-3 md:hidden">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayBookings = getBookingsForDate(day);

            if (dayBookings.length === 0 && !isToday && !isSelected) {
              return null;
            }

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-lg border border-border p-4",
                  isToday && "border-primary/50 bg-primary/5",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => handleDateClick(day)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{format(day, "EEEE")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(day, "MMMM d, yyyy")}
                    </p>
                  </div>
                  {isToday && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Today
                    </span>
                  )}
                </div>

                {dayBookings.length > 0 ? (
                  <div className="space-y-2">
                    {dayBookings.map((booking) => (
                      <StudioEventCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => handleEditEvent(booking)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bookings</p>
                )}
              </motion.div>
            );
          })}

          {/* Show empty state if no upcoming bookings */}
          {days.every((day) => getBookingsForDate(day).length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No bookings this month
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={handleNewEvent}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Booking
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Hidden on mobile, shown in modal when date selected */}
      <div className="hidden lg:block">
        <StudioSidebar
          selectedDate={selectedDate}
          bookings={selectedDate ? getBookingsForDate(selectedDate) : []}
          onEditBooking={handleEditEvent}
          onNewBooking={() => {
            setEditingBooking(null);
            setIsEventDialogOpen(true);
          }}
        />
      </div>

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
