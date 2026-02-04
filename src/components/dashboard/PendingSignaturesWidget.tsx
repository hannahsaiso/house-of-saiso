import { motion } from "framer-motion";
import { FileSignature, Clock, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSignatureRequests } from "@/hooks/useSignatureRequests";
import { format } from "date-fns";

const statusConfig = {
  pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
  sent: { icon: Clock, label: "Sent", variant: "outline" as const },
  viewed: { icon: Eye, label: "Viewed", variant: "default" as const },
};

export function PendingSignaturesWidget() {
  const { pendingSignatures, isLoading, checkSignatureStatus } = useSignatureRequests();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileSignature className="h-5 w-5 text-primary" />
            Pending Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingSignatures.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileSignature className="h-5 w-5 text-primary" />
            Pending Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileSignature className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No pending signatures
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileSignature className="h-5 w-5 text-primary" />
              Pending Signatures
              <Badge variant="secondary" className="ml-2">
                {pendingSignatures.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingSignatures.slice(0, 5).map((sig, index) => {
              const config = statusConfig[sig.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={sig.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {sig.client?.name || "Unknown Client"}
                      </p>
                      <Badge variant={config.variant} className="text-xs">
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sig.document_type === "studio_rules"
                        ? "Studio Rules"
                        : sig.document_type}
                      {sig.booking?.date && (
                        <> • {format(new Date(sig.booking.date), "MMM d, yyyy")}</>
                      )}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sig.docusign_envelope_id && checkSignatureStatus.mutate(sig.docusign_envelope_id)}
                    disabled={!sig.docusign_envelope_id || checkSignatureStatus.isPending}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </motion.div>
              );
            })}

            {pendingSignatures.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                +{pendingSignatures.length - 5} more pending
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
