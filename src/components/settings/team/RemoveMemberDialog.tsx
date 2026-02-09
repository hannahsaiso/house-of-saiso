import { useState } from "react";
import { AlertTriangle, Loader2, UserMinus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface RemoveMemberDialogProps {
  email: string;
  name?: string | null;
  userId?: string | null;
  isRemoving: boolean;
  onConfirm: () => void;
}

export function RemoveMemberDialog({
  email,
  name,
  userId,
  isRemoving,
  onConfirm,
}: RemoveMemberDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Team Member
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">{name || email}</span>{" "}
              from the team?
            </p>
            <p className="text-sm">
              This action will:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Remove their role and permissions</li>
              <li>Delete their profile from the system</li>
              <li>Disable their account access</li>
              <li>Revoke any pending invitations</li>
            </ul>
            <p className="text-sm font-medium text-destructive mt-2">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Member"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
