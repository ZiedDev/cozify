import { AlertDialog, Button, Typography } from "@heroui/react";

import { ConfirmationState } from "../types";

export type { ConfirmationState };

interface InterruptAlertProps {
  confirmation: ConfirmationState | null;
  onCancel: () => void;
}

export function InterruptAlert({
  confirmation,
  onCancel,
}: InterruptAlertProps) {
  const isOpen = confirmation !== null;

  if (!isOpen || !confirmation) return null;

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
            <Typography
              className="leading-relaxed"
              color="muted"
              type="body-sm"
            >
              {confirmation?.description}
            </Typography>
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
