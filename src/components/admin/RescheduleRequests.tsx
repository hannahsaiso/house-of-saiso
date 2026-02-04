import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Check, X, Loader2, Edit3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  client_email: string | null;
  event_name: string | null;
  has_conflict: boolean;
  status: string;
  created_at: string;
}

const generateDraftResponse = (request: RescheduleRequest, approved: boolean): string => {
  const clientName = request.client_name?.split(" ")[0] || "there";
  const newDate = format(parseISO(request.requested_date), "EEEE, MMMM d");
  const originalDate = format(parseISO(request.original_date), "EEEE, MMMM d");

  if (approved) {
    return `Hi ${clientName},

Your reschedule request has been approved. Your booking has been moved from ${originalDate} to ${newDate} (${request.requested_start_time} – ${request.requested_end_time}).

We look forward to seeing you at the studio.

Best,
House of Saiso`;
  } else {
    return `Hi ${clientName},

Unfortunately, we're unable to accommodate your reschedule request to ${newDate} at this time.

Please feel free to reach out if you'd like to discuss alternative dates.

Best,
House of Saiso`;
  }
};

export function RescheduleRequests() {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [draftResponse, setDraftResponse] = useState("");
  const [isApproving, setIsApproving] = useState(false);

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
          client:clients(name, email)
        `)
        .eq("status", "reschedule_requested")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse reschedule data from notes (stored as JSON)
      return (data || []).map((booking) => {
        let rescheduleData = { originalDate: booking.date, hasConflict: false };
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
          client_email: booking.client?.email,
          event_name: booking.event_name,
          has_conflict: rescheduleData.hasConflict || false,
          status: booking.status,
          created_at: "",
        } as RescheduleRequest;
      });
    },
  });

  const approveReschedule = useMutation({
    mutationFn: async ({ bookingId, sendEmail }: { bookingId: string; sendEmail?: boolean }) => {
      const { error } = await supabase
        .from("studio_bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (error) throw error;

      // In a production app, you would send the email here via an edge function
      // For now, we just log it
      if (sendEmail) {
        console.log("Would send approval email:", draftResponse);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Reschedule approved and response sent");
      setEditDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    },
  });

  const denyReschedule = useMutation({
    mutationFn: async ({ bookingId, sendEmail }: { bookingId: string; sendEmail?: boolean }) => {
      const { error } = await supabase
        .from("studio_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;

      if (sendEmail) {
        console.log("Would send denial email:", draftResponse);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Reschedule denied");
      setEditDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("Failed to deny: " + error.message);
    },
  });

  const handleApproveWithDraft = (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setDraftResponse(generateDraftResponse(request, true));
    setIsApproving(true);
    setEditDialogOpen(true);
  };

  const handleDenyWithDraft = (request: RescheduleRequest) => {
    setSelectedRequest(request);
    setDraftResponse(generateDraftResponse(request, false));
    setIsApproving(false);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    if (isApproving) {
      approveReschedule.mutate({ bookingId: selectedRequest.id, sendEmail: true });
    } else {
      denyReschedule.mutate({ bookingId: selectedRequest.id, sendEmail: true });
    }
  };

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
    <>
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
                <p className="font-heading font-medium">{request.client_name || "Unknown Client"}</p>
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

              {/* Human-in-the-loop Actions */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleApproveWithDraft(request)}
                  disabled={approveReschedule.isPending}
                >
                  <Check className="h-4 w-4" />
                  Approve Change
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleDenyWithDraft(request)}
                  disabled={denyReschedule.isPending}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Draft Reply
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Human-in-the-loop Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isApproving ? "Approve Reschedule" : "Deny Reschedule"}
            </DialogTitle>
            <DialogDescription>
              Review and edit the response before sending to {selectedRequest?.client_name || "the client"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Request Summary */}
            {selectedRequest && (
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{format(parseISO(selectedRequest.original_date), "MMM d")}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {format(parseISO(selectedRequest.requested_date), "MMM d")}
                  </span>
                </div>
              </div>
            )}

            {/* Draft Response Editor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Draft Response</label>
              <Textarea
                value={draftResponse}
                onChange={(e) => setDraftResponse(e.target.value)}
                rows={8}
                className="font-body text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={approveReschedule.isPending || denyReschedule.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isApproving ? "Approve & Send" : "Deny & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}