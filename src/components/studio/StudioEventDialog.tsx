import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, FileSignature, AlertCircle, Package } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudioBookings, StudioBooking, CreateBookingData } from "@/hooks/useStudioBookings";
import { checkBookingConflicts } from "@/hooks/useBookingConflicts";
import { useSignatureRequests } from "@/hooks/useSignatureRequests";
import { useSmartBooking } from "@/hooks/useSmartBooking";
import { useInventory } from "@/hooks/useInventory";
import { SmartBookingSuggestion } from "./SmartBookingSuggestion";
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
  const { createSignatureRequest } = useSignatureRequests();
  const { items: inventoryItems } = useInventory();
  const { checkAvailability, isChecking: isAIChecking, result: aiResult, clearResult } = useSmartBooking();
  const [isChecking, setIsChecking] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

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
    setSelectedResources([]);
    clearResult();
  }, [booking, defaultDate, open]);

  // Smart check when date/time changes
  const handleSmartCheck = async () => {
    if (formData.date && formData.start_time && formData.end_time) {
      await checkAvailability({
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        booking_type: formData.booking_type,
        required_resources: selectedResources,
      });
    }
  };

  const toggleResource = (id: string) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

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
        // Create booking
        const newBooking = await createBooking.mutateAsync(formData);
        
        // If client info provided, send signature request for studio rules
        if (clientEmail && clientName && newBooking) {
          try {
            await createSignatureRequest.mutateAsync({
              bookingId: newBooking.id,
              recipientEmail: clientEmail,
              recipientName: clientName,
              documentType: "studio_rules",
            });
            toast.success("Studio rules sent for signing");
          } catch (sigError) {
            console.error("Signature request failed:", sigError);
            // Don't block booking creation if signature fails
          }
        }
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

  const isSubmitting = createBooking.isPending || updateBooking.isPending || isChecking || isAIChecking;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Client Info for Signature Request - Only for new bookings */}
          {!booking && (
            <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileSignature className="h-4 w-4 text-primary" />
                Client Signature (Optional)
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Add client details to automatically send Studio Rules for signing.
                  Booking status will remain "Pending" until signed.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    placeholder="John Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Smart Suggestion */}
          <SmartBookingSuggestion
            isLoading={isAIChecking}
            suggestion={aiResult?.suggestion || null}
            alternatives={aiResult?.availableAlternatives}
            onAcceptAlternative={(id) => {
              setSelectedResources((prev) => [...prev.filter((r) => r !== id), id]);
            }}
            onDismiss={clearResult}
          />

          {/* Resource Selection */}
          {inventoryItems.length > 0 && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4 text-primary" />
                  Reserve Equipment
                </div>
                <button
                  type="button"
                  onClick={handleSmartCheck}
                  className="text-xs text-primary hover:underline"
                >
                  Check Availability
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {inventoryItems.slice(0, 8).map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 rounded-md border border-border/30 p-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedResources.includes(item.id)}
                      onCheckedChange={() => toggleResource(item.id)}
                    />
                    <span className="text-xs truncate">{item.item_name}</span>
                  </label>
                ))}
              </div>
              {aiResult?.unavailableResources && aiResult.unavailableResources.length > 0 && (
                <p className="text-xs text-destructive">
                  Unavailable: {aiResult.unavailableResources.join(", ")}
                </p>
              )}
            </div>
          )}

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
