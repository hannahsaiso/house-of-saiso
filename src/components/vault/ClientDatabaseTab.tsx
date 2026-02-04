import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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

export function ClientDatabaseTab() {
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
            <TableHead className="text-[hsl(var(--vault-accent))]">Email</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Services</TableHead>
            <TableHead className="text-[hsl(var(--vault-accent))]">Onboarded</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
