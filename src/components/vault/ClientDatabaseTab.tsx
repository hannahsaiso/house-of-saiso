import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Megaphone, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { StudioRenterProfile } from "./StudioRenterProfile";

type ClientType = "studio_renter" | "agency_client";

const CLIENT_TYPE_CONFIG: Record<ClientType, { label: string; icon: React.ElementType; className: string }> = {
  studio_renter: {
    label: "Studio",
    icon: Building2,
    className: "border-[hsl(var(--vault-accent))]/30 bg-[hsl(var(--vault-accent))]/10 text-[hsl(var(--vault-accent))]",
  },
  agency_client: {
    label: "Agency",
    icon: Megaphone,
    className: "border-[hsl(var(--vault-success))]/30 bg-[hsl(var(--vault-success))]/10 text-[hsl(var(--vault-success))]",
  },
};

export function ClientDatabaseTab() {
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  const { data: clients, isLoading } = useQuery({
    queryKey: ["all-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--vault-accent))]" />
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--vault-border))] p-12 text-center">
        <p className="text-[hsl(var(--vault-muted))]">
          No clients in the database yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
      <div className="border-b border-[hsl(var(--vault-border))] p-4">
        <h3 className="font-heading text-lg font-medium">Client Database</h3>
        <p className="text-sm text-[hsl(var(--vault-muted))]">
          {clients.length} total clients
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-[hsl(var(--vault-border))] hover:bg-transparent">
            <TableHead className="text-[hsl(var(--vault-accent))]">Name</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Company</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Type</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Email</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Services</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Onboarded</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="border-[hsl(var(--vault-border))] hover:bg-[hsl(var(--vault-background))]/50"
            >
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>
                {client.company || (
                  <span className="text-[hsl(var(--vault-muted))]">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {((client.client_type as ClientType[]) || ["agency_client"]).map((type) => {
                    const config = CLIENT_TYPE_CONFIG[type as ClientType];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <Badge
                        key={type}
                        variant="outline"
                        className={cn("text-xs gap-1", config.className)}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell>
                {client.email || (
                  <span className="text-[hsl(var(--vault-muted))]">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {client.services_needed?.slice(0, 2).map((service) => (
                    <Badge
                      key={service}
                      variant="outline"
                      className="border-[hsl(var(--vault-border))] text-xs"
                    >
                      {service}
                    </Badge>
                  ))}
                  {(client.services_needed?.length || 0) > 2 && (
                    <Badge
                      variant="outline"
                      className="border-[hsl(var(--vault-border))] text-xs"
                    >
                      +{client.services_needed!.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {client.onboarded_at ? (
                  format(new Date(client.onboarded_at), "MMM d, yyyy")
                ) : (
                  <span className="text-[hsl(var(--vault-muted))]">Pending</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClient(client)}
                  className="text-[hsl(var(--vault-accent))]"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Client Profile Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[hsl(var(--vault-background))]">
          <SheetHeader>
            <SheetTitle className="text-[hsl(var(--vault-foreground))]">
              Client Profile
            </SheetTitle>
          </SheetHeader>
          {selectedClient && (
            <div className="mt-6">
              {(selectedClient.client_type as ClientType[] || []).includes("studio_renter") &&
              !(selectedClient.client_type as ClientType[] || []).includes("agency_client") ? (
                <StudioRenterProfile
                  clientId={selectedClient.id}
                  clientName={selectedClient.name}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--vault-accent))]/10">
                      <Megaphone className="h-6 w-6 text-[hsl(var(--vault-accent))]" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-[hsl(var(--vault-foreground))]">
                        {selectedClient.name}
                      </h2>
                      <div className="flex gap-1">
                        {((selectedClient.client_type as ClientType[]) || ["agency_client"]).map((type) => {
                          const config = CLIENT_TYPE_CONFIG[type as ClientType];
                          if (!config) return null;
                          return (
                            <Badge key={type} variant="outline" className={cn("text-xs", config.className)}>
                              {config.label} Client
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[hsl(var(--vault-muted))]">
                    Full project workspace available in Projects section.
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
