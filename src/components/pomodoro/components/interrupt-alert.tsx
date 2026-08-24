import { AlertDialog, Button } from "@heroui/react";

export interface ConfirmationState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "secondary" | "danger" | "danger-soft";
  status?: "default" | "warning" | "danger" | "success" | "accent";
  onConfirm: () => void;
}

interface InterruptAlertProps {
  confirmation: ConfirmationState | null;
  onCancel: () => void;
}

export function InterruptAlert({
  confirmation,
  onCancel,
}: InterruptAlertProps) {
  const isOpen = confirmation !== null;

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-md">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon
              status={
                confirmation?.status ||
                (confirmation?.confirmVariant === "danger"
                  ? "danger"
                  : "warning")
              }
            />
            <AlertDialog.Heading>
              {confirmation?.title || "Are you sure?"}
            </AlertDialog.Heading>
          </AlertDialog.Header>

          <AlertDialog.Body>
            <p className="text-muted text-sm leading-relaxed">
              {confirmation?.description}
            </p>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" onPress={onCancel}>
              Cancel
            </Button>
            <Button
              variant={confirmation?.confirmVariant || "primary"}
              onPress={() => {
                confirmation?.onConfirm();
                onCancel();
              }}
            >
              {confirmation?.confirmLabel || "Confirm"}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
