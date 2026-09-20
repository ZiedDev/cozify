import { Modal, Drawer, Button, Chip, Typography } from "@heroui/react";
import { SkipForward } from "lucide-react";

import { formatDurationLabel, formatTimerDisplay } from "../logic/time-utils";

import { TimerDurations } from "@/config/timer";
import { useIsMobile } from "@/hooks/use-is-mobile";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  durations: TimerDurations;
  currentCycle: number;
  timeUsed: number;
  timeLeft: number;
  onSelectBreak: (mode: "shortBreak" | "longBreak") => void;
  onSkipBreak: () => void;
};

export function BreakModal({
  isOpen,
  onOpenChange,
  durations,
  currentCycle,
  timeUsed,
  timeLeft,
  onSelectBreak,
  onSkipBreak,
}: Props) {
  const isMobile = useIsMobile();

  if (!isOpen || timeLeft <= 0) return null;

  const content = (
    <>
      {/* Live elapsed summary */}
      <div className="p-3 rounded-2xl bg-surface-secondary/50 border border-separator/60 flex items-center justify-between">
        <div className="space-y-0.5">
          <Typography className="text-muted text-[11px]" type="body-xs">
            Current Cycle
          </Typography>
          <Typography type="body-sm" weight="semibold">
            Cycle {currentCycle}
          </Typography>
        </div>
        <div className="text-right space-y-0.5">
          <Typography className="text-accent font-mono text-sm" weight="bold">
            {formatTimerDisplay(timeUsed)}
          </Typography>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {/* Short Break */}
        <button
          className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
                Completes cycle
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
          className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
                Completes cycle
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

        {/* Start Next Cycle (Skip Break) */}
        <button
          className="w-full p-3 rounded-2xl bg-surface-secondary/70 hover:bg-accent/10 border border-separator/60 hover:border-accent/40 text-left transition-colors flex items-center justify-between group cursor-pointer"
          type="button"
          onClick={() => {
            onOpenChange(false);
            onSkipBreak();
          }}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Typography
                className="text-foreground group-hover:text-accent transition-colors"
                type="body-sm"
                weight="semibold"
              >
                Start Next Cycle
              </Typography>
              <Chip
                className="text-[10px] h-4.5 px-1.5 font-medium"
                size="sm"
                variant="soft"
              >
                No break
              </Chip>
            </div>
            <Typography className="block" color="muted" type="body-xs">
              Complete Cycle {currentCycle} and jump straight into Cycle{" "}
              {currentCycle + 1}
            </Typography>
          </div>
          <SkipForward className="size-4 shrink-0 text-muted group-hover:text-accent transition-colors" />
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Content placement="bottom">
          <Drawer.Dialog className="max-h-[85dvh] flex flex-col p-4 shadow-2xl rounded-t-3xl rounded-b-none border-t border-separator/40 bg-surface/98 backdrop-blur-xl">
            <Drawer.Handle />
            <Drawer.Header className="flex-row items-center justify-between pb-2 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-2xl bg-accent/15 text-accent shrink-0">
                  <SkipForward className="size-5" />
                </div>
                <div>
                  <Drawer.Heading className="text-base font-semibold text-foreground">
                    Skip Current Cycle
                  </Drawer.Heading>
                  <Typography color="muted" type="body-xs">
                    Complete Cycle {currentCycle} & choose next step
                  </Typography>
                </div>
              </div>
              <Drawer.CloseTrigger />
            </Drawer.Header>

            <Drawer.Body className="space-y-3 p-0 overflow-y-auto mt-2">
              {content}
            </Drawer.Body>

            <Drawer.Footer className="pt-2">
              <Button
                className="w-full"
                slot="close"
                variant="tertiary"
                onPress={() => onOpenChange(false)}
              >
                Keep Focusing
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    );
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <SkipForward className="size-5" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Skip Current Cycle</Modal.Heading>
              <Typography
                className="font-normal mt-0.5"
                color="muted"
                type="body-xs"
              >
                Complete Cycle {currentCycle} with actual focus time and choose
                what&apos;s next
              </Typography>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-3">{content}</Modal.Body>

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
