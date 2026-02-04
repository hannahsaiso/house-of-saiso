import { format } from "date-fns";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioBooking } from "@/hooks/useStudioBookings";
import { StudioEventCard } from "./StudioEventCard";

interface StudioSidebarProps {
  selectedDate: Date | null;
  bookings: StudioBooking[];
  onEditBooking: (booking: StudioBooking) => void;
  onNewBooking: () => void;
}

export function StudioSidebar({
  selectedDate,
  bookings,
  onEditBooking,
  onNewBooking,
}: StudioSidebarProps) {
  return (
    <div className="w-80 shrink-0 rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-editorial">
            {selectedDate ? format(selectedDate, "EEEE") : "Select a date"}
          </span>
        </div>
      </div>

      {selectedDate && (
        <>
          <h3 className="mb-4 font-heading text-xl font-semibold">
            {format(selectedDate, "MMMM d, yyyy")}
          </h3>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                No events scheduled
              </p>
              <Button size="sm" onClick={onNewBooking} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <StudioEventCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => onEditBooking(booking)}
                />
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={onNewBooking}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          )}
        </>
      )}

      {!selectedDate && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Click on a date to see events
          </p>
        </div>
      )}
    </div>
  );
}
