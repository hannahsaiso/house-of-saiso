import { supabase } from "@/integrations/supabase/client";

interface ConflictCheckParams {
  date: string;
  start_time: string;
  end_time: string;
  excludeId?: string;
}

export async function checkBookingConflicts({
  date,
  start_time,
  end_time,
  excludeId,
}: ConflictCheckParams): Promise<{ hasConflict: boolean; conflictingBookings: string[] }> {
  // Check for overlapping bookings on the same date
  // Conflict conditions:
  // 1. New start is within existing booking (start_time <= new_start < end_time)
  // 2. New end is within existing booking (start_time < new_end <= end_time)
  // 3. New booking encompasses existing booking (new_start <= start_time AND new_end >= end_time)
  
  let query = supabase
    .from("studio_bookings")
    .select("id, event_name, start_time, end_time")
    .eq("date", date)
    .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking conflicts:", error);
    return { hasConflict: false, conflictingBookings: [] };
  }

  const conflictingBookings = data?.map(
    (b) => b.event_name || `${b.start_time} - ${b.end_time}`
  ) || [];

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
}

export function useBookingConflicts() {
  return { checkConflicts: checkBookingConflicts };
}
