import { useState, useEffect } from "react";
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
import { useFinancialEntries, FinancialEntry, CreateFinancialEntryData } from "@/hooks/useFinancialEntries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface FinancialEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: FinancialEntry | null;
}

export function FinancialEntryDialog({
  open,
  onOpenChange,
  entry,
}: FinancialEntryDialogProps) {
  const { createEntry, updateEntry } = useFinancialEntries();

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState<CreateFinancialEntryData>({
    date: format(new Date(), "yyyy-MM-dd"),
    service_type: "agency",
    amount: 0,
    payment_status: "sent",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        client_id: entry.client_id || undefined,
        project_id: entry.project_id || undefined,
        service_type: entry.service_type,
        description: entry.description || undefined,
        amount: Number(entry.amount),
        payment_status: entry.payment_status,
      });
    } else {
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        service_type: "agency",
        amount: 0,
        payment_status: "sent",
      });
    }
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entry) {
      await updateEntry.mutateAsync({ id: entry.id, ...formData });
    } else {
      await createEntry.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  const isSubmitting = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] text-[hsl(var(--vault-foreground))]">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(var(--vault-foreground))]">
            {entry ? "Edit Entry" : "New Financial Entry"}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--vault-muted))]">
            {entry ? "Update the entry details." : "Add a new financial record."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
              className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Client</Label>
            <Select
              value={formData.client_id || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  client_id: value === "none" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
                <SelectItem value="none">No client</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    {client.company && ` (${client.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Service Type</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: "agency" | "studio") =>
                  setFormData({ ...formData, service_type: value })
                }
              >
                <SelectTrigger className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[hsl(var(--vault-foreground))]">Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value: "sent" | "paid" | "overdue") =>
                  setFormData({ ...formData, payment_status: value })
                }
              >
                <SelectTrigger className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))]">
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              required
              className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Description</Label>
            <Textarea
              placeholder="Invoice details, service description..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))] hover:bg-[hsl(var(--vault-accent))]/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {entry ? "Save Changes" : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
