import { Modal, Button, Chip } from "@heroui/react";
import { Coffee, SkipForward } from "lucide-react";

import { formatDurationLabel } from "../logic/time-utils";

import { TimerDurations } from "@/config/timer";

interface BreakModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  durations: TimerDurations;
  isCycleCompleted: boolean;
  onSelectBreak: (mode: "shortBreak" | "longBreak") => void;
  onSkipBreak: () => void;
}

export function BreakModal({
  isOpen,
  onOpenChange,
  durations,
  isCycleCompleted,
  onSelectBreak,
  onSkipBreak,
}: BreakModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <Coffee className="size-5" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Time to Recharge</Modal.Heading>
              <p className="text-xs text-muted font-normal mt-0.5">
                Starting a break will count the current cycle as completed
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-3">
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
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      Short Break
                    </span>
                    <Chip
                      className="text-[10px] h-4.5 px-1.5 font-medium"
                      color="accent"
                      size="sm"
                      variant="soft"
                    >
                      Completes current cycle
                    </Chip>
                  </div>
                  <span className="text-xs text-muted block">
                    Quick stretch, water, or eye rest
                  </span>
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                  {formatDurationLabel(durations.shortBreak)}
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
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      Long Break
                    </span>
                    <Chip
                      className="text-[10px] h-4.5 px-1.5 font-medium"
                      color="accent"
                      size="sm"
                      variant="soft"
                    >
                      Completes current cycle
                    </Chip>
                  </div>
                  <span className="text-xs text-muted block">
                    Walk around, snack, or mental reset
                  </span>
                </div>
                <span className="text-xs font-bold text-muted group-hover:text-accent shrink-0 pl-2">
                  {formatDurationLabel(durations.longBreak)}
                </span>
              </button>

              {/* Skip Break Option - only active when current cycle is completed */}
              <button
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                  isCycleCompleted
                    ? "bg-surface-secondary/70 hover:bg-accent/10 border-separator/60 hover:border-accent/40 cursor-pointer"
                    : "bg-surface-secondary/30 border-separator/30 opacity-45 cursor-not-allowed"
                }`}
                disabled={!isCycleCompleted}
                type="button"
                onClick={() => {
                  if (!isCycleCompleted) return;
                  onOpenChange(false);
                  onSkipBreak();
                }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isCycleCompleted
                          ? "text-foreground group-hover:text-accent"
                          : "text-muted"
                      }`}
                    >
                      Skip Break
                    </span>
                  </div>
                  <span className="text-xs text-muted block">
                    {isCycleCompleted
                      ? "Jump straight into the next focus cycle"
                      : "Complete the current focus cycle first"}
                  </span>
                </div>
                <SkipForward
                  className={`size-4 shrink-0 transition-colors ${
                    isCycleCompleted
                      ? "text-muted group-hover:text-accent"
                      : "text-muted/40"
                  }`}
                />
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
