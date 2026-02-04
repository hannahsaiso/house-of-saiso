import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
import { useStudioBookings, StudioBooking, CreateBookingData } from "@/hooks/useStudioBookings";
import { checkBookingConflicts } from "@/hooks/useBookingConflicts";
import { toast } from "sonner";

interface StudioEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: StudioBooking | null;
  defaultDate?: Date | null;
}

const BOOKING_TYPES = [
  { value: "photo-shoot", label: "Photo Shoot" },
  { value: "video", label: "Video Production" },
  { value: "gallery-show", label: "Gallery Show" },
  { value: "rental", label: "Studio Rental" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "blocked", label: "Blocked" },
];

export function StudioEventDialog({
  open,
  onOpenChange,
  booking,
  defaultDate,
}: StudioEventDialogProps) {
  const { createBooking, updateBooking, deleteBooking } = useStudioBookings();
  const [isChecking, setIsChecking] = useState(false);

  const [formData, setFormData] = useState<CreateBookingData>({
    event_name: "",
    date: "",
    start_time: "09:00",
    end_time: "17:00",
    booking_type: "photo-shoot",
    status: "pending",
    notes: "",
    is_blocked: false,
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        event_name: booking.event_name || "",
        date: booking.date,
        start_time: booking.start_time.slice(0, 5),
        end_time: booking.end_time.slice(0, 5),
        booking_type: booking.booking_type,
        status: booking.status || "pending",
        notes: booking.notes || "",
        is_blocked: booking.is_blocked,
        client_id: booking.client_id || undefined,
      });
    } else {
      setFormData({
        event_name: "",
        date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "17:00",
        booking_type: "photo-shoot",
        status: "pending",
        notes: "",
        is_blocked: false,
      });
    }
  }, [booking, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);

    try {
      // Check for conflicts
      const { hasConflict, conflictingBookings } = await checkBookingConflicts({
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        excludeId: booking?.id,
      });

      if (hasConflict) {
        toast.error(
          `Time slot conflicts with: ${conflictingBookings.join(", ")}`
        );
        setIsChecking(false);
        return;
      }

      if (booking) {
        await updateBooking.mutateAsync({ id: booking.id, ...formData });
      } else {
        await createBooking.mutateAsync(formData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving booking:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    if (booking && confirm("Are you sure you want to delete this booking?")) {
      await deleteBooking.mutateAsync(booking.id);
      onOpenChange(false);
    }
  };

  const isSubmitting = createBooking.isPending || updateBooking.isPending || isChecking;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {booking ? "Edit Event" : "New Event"}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? "Update the event details below."
              : "Fill in the details to create a new studio booking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_name">Event Name</Label>
            <Input
              id="event_name"
              placeholder="Client photoshoot, Gallery opening..."
              value={formData.event_name}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking_type">Type</Label>
              <Select
                value={formData.booking_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, booking_type: value })
                }
              >
                <SelectTrigger id="booking_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {booking && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteBooking.isPending}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {booking ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
