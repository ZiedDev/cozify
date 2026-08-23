import { AlertDialog, Button } from "@heroui/react";

import { TimerMode } from "@/config/timer";

interface InterruptAlertProps {
  mode: TimerMode;
  pendingAction: (() => void) | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function InterruptAlert({
  mode,
  pendingAction,
  onCancel,
  onConfirm,
}: InterruptAlertProps) {
  const isFocus = mode === "focus";

  return (
    <AlertDialog.Backdrop
      isOpen={pendingAction !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-md">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status={isFocus ? "warning" : "default"} />
            <AlertDialog.Heading>
              {isFocus ? "End current focus cycle?" : "End break early?"}
            </AlertDialog.Heading>
          </AlertDialog.Header>

          <AlertDialog.Body>
            <p className="text-muted text-sm leading-relaxed">
              {isFocus
                ? "Your active focus session will be counted as completed, and you will advance to the next cycle."
                : "Your break timer will end now and get you ready for the next focus cycle."}
            </p>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" onPress={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onPress={onConfirm}>
              {isFocus ? "Complete & Switch" : "Start Focus"}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
