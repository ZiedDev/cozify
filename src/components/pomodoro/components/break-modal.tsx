import { Modal, Button } from "@heroui/react";
import { Coffee, SkipForward } from "lucide-react";

import { TimerDurations } from "@/config/timer";

interface BreakModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  durations: TimerDurations;
  onSelectBreak: (mode: "shortBreak" | "longBreak") => void;
  onSkipBreak: () => void;
}

export function BreakModal({
  isOpen,
  onOpenChange,
  durations,
  onSelectBreak,
  onSkipBreak,
}: BreakModalProps) {
  const formatMinSec = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    if (s === 0) return `${m} min`;

    return `${m}m ${s}s`;
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[400px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <Coffee className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Time to Recharge</Modal.Heading>
          </Modal.Header>

          <Modal.Body className="space-y-3">
            <p className="text-muted text-sm leading-relaxed">
              You’re completing this cycle. Stepping away helps reset your
              attention and keeps your mind sharp.
            </p>

            <div className="space-y-2 pt-1">
              {/* Short Break */}
              <button
                className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSelectBreak("shortBreak");
                }}
              >
                <div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                    Short Break
                  </span>
                  <span className="text-xs text-muted">
                    Quick stretch, water, or eye rest
                  </span>
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                  {formatMinSec(durations.shortBreak)}
                </span>
              </button>

              {/* Long Break */}
              <button
                className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSelectBreak("longBreak");
                }}
              >
                <div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                    Long Break
                  </span>
                  <span className="text-xs text-muted">
                    Walk around, snack, or mental reset
                  </span>
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                  {formatMinSec(durations.longBreak)}
                </span>
              </button>

              {/* Skip Break Option */}
              <button
                className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSkipBreak();
                }}
              >
                <div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                    Skip Break
                  </span>
                  <span className="text-xs text-muted">
                    Jump straight into the next focus cycle
                  </span>
                </div>
                <SkipForward className="size-4 text-muted group-hover:text-accent shrink-0" />
              </button>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              slot="close"
              variant="tertiary"
              onPress={() => onOpenChange(false)}
            >
              Keep Focusing
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
