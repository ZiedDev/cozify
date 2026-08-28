import { Modal, Button, Chip, Typography } from "@heroui/react";
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
              <Typography
                className="font-normal mt-0.5"
                color="muted"
                type="body-xs"
              >
                Starting a break will count the current cycle as completed
              </Typography>
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
                    <Typography
                      className="text-foreground group-hover:text-accent transition-colors"
                      type="body-sm"
                      weight="semibold"
                    >
                      Short Break
                    </Typography>
                    <Chip
                      className="text-[10px] h-4.5 px-1.5 font-medium"
                      color="accent"
                      size="sm"
                      variant="soft"
                    >
                      Completes current cycle
                    </Chip>
                  </div>
                  <Typography className="block" color="muted" type="body-xs">
                    Quick stretch, water, or eye rest
                  </Typography>
                </div>
                <Typography
                  className="group-hover:text-accent shrink-0 pl-2"
                  color="muted"
                  type="body-xs"
                  weight="bold"
                >
                  {formatDurationLabel(durations.shortBreak)}
                </Typography>
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
                    <Typography
                      className="text-foreground group-hover:text-accent transition-colors"
                      type="body-sm"
                      weight="semibold"
                    >
                      Long Break
                    </Typography>
                    <Chip
                      className="text-[10px] h-4.5 px-1.5 font-medium"
                      color="accent"
                      size="sm"
                      variant="soft"
                    >
                      Completes current cycle
                    </Chip>
                  </div>
                  <Typography className="block" color="muted" type="body-xs">
                    Walk around, snack, or mental reset
                  </Typography>
                </div>
                <Typography
                  className="group-hover:text-accent shrink-0 pl-2"
                  color="muted"
                  type="body-xs"
                  weight="bold"
                >
                  {formatDurationLabel(durations.longBreak)}
                </Typography>
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
                    <Typography
                      className={`transition-colors ${
                        isCycleCompleted
                          ? "text-foreground group-hover:text-accent"
                          : "text-muted"
                      }`}
                      type="body-sm"
                      weight="semibold"
                    >
                      Skip Break
                    </Typography>
                  </div>
                  <Typography className="block" color="muted" type="body-xs">
                    {isCycleCompleted
                      ? "Jump straight into the next focus cycle"
                      : "Complete the current focus cycle first"}
                  </Typography>
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
