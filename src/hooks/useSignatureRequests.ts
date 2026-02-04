import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SignatureRequest {
  id: string;
  booking_id: string | null;
  client_id: string | null;
  project_id: string | null;
  document_type: string;
  docusign_envelope_id: string | null;
  status: string;
  signed_at: string | null;
  signed_document_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    company: string | null;
  } | null;
  booking?: {
    date: string;
    event_name: string | null;
  } | null;
}

export function useSignatureRequests() {
  const queryClient = useQueryClient();

  const { data: pendingSignatures, isLoading } = useQuery({
    queryKey: ["pending-signatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signature_requests")
        .select(`
          *,
          client:clients(name, company),
          booking:studio_bookings(date, event_name)
        `)
        .in("status", ["pending", "sent", "viewed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SignatureRequest[];
    },
  });

  const createSignatureRequest = useMutation({
    mutationFn: async ({
      bookingId,
      clientId,
      projectId,
      recipientEmail,
      recipientName,
      documentType = "studio_rules",
    }: {
      bookingId: string;
      clientId?: string;
      projectId?: string;
      recipientEmail: string;
      recipientName: string;
      documentType?: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("docusign-signature", {
        body: {
          action: "create",
          bookingId,
          clientId,
          projectId,
          recipientEmail,
          recipientName,
          documentType,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
      queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
      toast.success("Signature request sent successfully");
    },
    onError: (error) => {
      console.error("Signature request error:", error);
      toast.error("Failed to send signature request");
    },
  });

  const checkSignatureStatus = useMutation({
    mutationFn: async (envelopeId: string) => {
      const response = await supabase.functions.invoke("docusign-signature", {
        body: {
          action: "status",
          envelopeId,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-signatures"] });
    },
  });

  return {
    pendingSignatures: pendingSignatures || [],
    isLoading,
    createSignatureRequest,
    checkSignatureStatus,
  };
}
