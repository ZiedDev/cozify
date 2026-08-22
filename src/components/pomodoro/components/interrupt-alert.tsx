import { AlertDialog, Button } from "@heroui/react";

import { TIMER_MODE_LABELS, TimerMode } from "@/config/timer";

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
  return (
    <AlertDialog.Backdrop
      isOpen={pendingAction !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-[400px]">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading>Switch active session?</AlertDialog.Heading>
          </AlertDialog.Header>

          <AlertDialog.Body>
            <p className="text-muted text-sm leading-relaxed">
              You currently have an active{" "}
              {TIMER_MODE_LABELS[mode].toLowerCase()} countdown running.
              Switching or resetting now will end your current progress.
            </p>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" onPress={onCancel}>
              Keep Going
            </Button>
            <Button variant="primary" onPress={onConfirm}>
              Confirm Switch
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
