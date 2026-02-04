import { StudioBooking } from "@/hooks/useStudioBookings";
import { cn } from "@/lib/utils";

interface StudioEventCardProps {
  booking: StudioBooking;
  onClick?: () => void;
  compact?: boolean;
}

const typeColors: Record<string, string> = {
  "photo-shoot": "bg-blue-100 text-blue-800 border-blue-200",
  "video": "bg-purple-100 text-purple-800 border-purple-200",
  "gallery-show": "bg-amber-100 text-amber-800 border-amber-200",
  "rental": "bg-green-100 text-green-800 border-green-200",
  "blocked": "bg-red-100 text-red-800 border-red-200",
};

const statusIndicators: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-green-500",
  blocked: "bg-red-500",
};

export function StudioEventCard({ booking, onClick, compact }: StudioEventCardProps) {
  const colorClass = booking.is_blocked
    ? typeColors.blocked
    : typeColors[booking.booking_type] || "bg-muted text-foreground border-border";
  const statusColor = statusIndicators[booking.status || "pending"];

  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          "cursor-pointer truncate rounded border px-1.5 py-0.5 text-xs font-medium transition-transform hover:scale-[1.02]",
          colorClass
        )}
      >
        <div className="flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", statusColor)} />
          <span className="truncate">
            {booking.event_name || booking.booking_type}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md",
        colorClass
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", statusColor)} />
            <h4 className="font-medium">
              {booking.event_name || booking.booking_type}
            </h4>
          </div>
          <p className="text-xs opacity-80">
            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
          </p>
          {booking.client?.name && (
            <p className="text-xs opacity-70">{booking.client.name}</p>
          )}
        </div>
        <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs capitalize">
          {booking.status}
        </span>
      </div>
    </div>
  );
}
