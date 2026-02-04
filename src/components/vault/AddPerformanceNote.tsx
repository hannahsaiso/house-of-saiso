import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddPerformanceNoteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  onSubmit: (note: string) => Promise<unknown>;
}

export function AddPerformanceNote({
  open,
  onOpenChange,
  staffId,
  onSubmit,
}: AddPerformanceNoteProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(note);
      setNote("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-card))] text-[hsl(var(--vault-foreground))]">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Performance Note</DialogTitle>
          <DialogDescription className="text-[hsl(var(--vault-muted))]">
            Record feedback, achievements, or areas for improvement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--vault-foreground))]">Note</Label>
            <Textarea
              placeholder="Enter your note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              required
              className="border-[hsl(var(--vault-border))] bg-[hsl(var(--vault-background))] text-[hsl(var(--vault-foreground))]"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              className="bg-[hsl(var(--vault-accent))] text-[hsl(var(--vault-background))] hover:bg-[hsl(var(--vault-accent))]/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
