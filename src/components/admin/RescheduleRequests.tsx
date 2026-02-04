import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface RescheduleRequest {
  id: string;
  original_booking_id: string;
  original_date: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  client_name: string | null;
  event_name: string | null;
  has_conflict: boolean;
  status: string;
  created_at: string;
}

export function RescheduleRequests() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["reschedule-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_bookings")
        .select(`
          id,
          date,
          start_time,
          end_time,
          event_name,
          status,
          notes,
          client:clients(name)
        `)
        .eq("status", "reschedule_requested")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse reschedule data from notes (stored as JSON)
      return (data || []).map((booking) => {
        let rescheduleData = { originalDate: booking.date };
        try {
          if (booking.notes) {
            const parsed = JSON.parse(booking.notes);
            if (parsed.reschedule) {
              rescheduleData = parsed.reschedule;
            }
          }
        } catch (e) {
          // Notes not in expected format
        }

        return {
          id: booking.id,
          original_booking_id: booking.id,
          original_date: rescheduleData.originalDate || booking.date,
          requested_date: booking.date,
          requested_start_time: booking.start_time,
          requested_end_time: booking.end_time,
          client_name: booking.client?.name,
          event_name: booking.event_name,
          has_conflict: false,
          status: booking.status,
          created_at: "",
        } as RescheduleRequest;
      });
    },
  });

  const approveReschedule = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("studio_bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Reschedule approved");
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    },
  });

  const denyReschedule = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("studio_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Reschedule denied");
    },
    onError: (error) => {
      toast.error("Failed to deny: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Calendar className="h-5 w-5" />
            Reschedule Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            No pending reschedule requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <Calendar className="h-5 w-5" />
          Reschedule Requests
          <Badge variant="secondary" className="ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border p-4"
          >
            {/* Client & Event Info */}
            <div className="mb-4">
              <p className="font-medium">{request.client_name || "Unknown Client"}</p>
              <p className="text-sm text-muted-foreground">
                {request.event_name || "Studio Booking"}
              </p>
            </div>

            {/* Date Comparison */}
            <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
              <div className="flex-1 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Original
                </p>
                <p className="mt-1 font-heading text-lg">
                  {format(parseISO(request.original_date), "MMM d")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Requested
                </p>
                <p className="mt-1 font-heading text-lg">
                  {format(parseISO(request.requested_date), "MMM d")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.requested_start_time} – {request.requested_end_time}
                </p>
              </div>
            </div>

            {/* Conflict Warning */}
            {request.has_conflict && (
              <div className="mt-3 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
                ⚠️ Conflict detected with existing booking
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={() => approveReschedule.mutate(request.id)}
                disabled={approveReschedule.isPending}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => denyReschedule.mutate(request.id)}
                disabled={denyReschedule.isPending}
              >
                <X className="h-4 w-4" />
                Deny
              </Button>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
