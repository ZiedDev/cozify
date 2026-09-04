import { Button, Tooltip } from "@heroui/react";
import {
  Play,
  Pause,
  SkipForward,
  Flag,
  RotateCcw,
  PictureInPicture2,
} from "lucide-react";

import { DurationsPopover } from "./durations-popover";

import { TimerDurations } from "@/config/timer";
import { usePip } from "@/hooks/use-pip";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isFocus: boolean;
  hasStarted: boolean;
  isReadyToFinish: boolean;
  durations: TimerDurations;
  timeLeft: number;
  isDurationPopoverOpen: boolean;
  onToggle: () => void;
  onReset: () => void;
  onOpenBreakModal: () => void;
  onSwitchToFocus: () => void;
  onOpenSaveModal: () => void;
  onDurationPopoverOpenChange: (open: boolean) => void;
  setCustomDurations: (newDurations: Partial<TimerDurations>) => void;
}

export function TimerControls({
  isRunning,
  isPaused,
  isFocus,
  hasStarted,
  isReadyToFinish,
  durations,
  timeLeft,
  isDurationPopoverOpen,
  onToggle,
  onReset,
  onOpenBreakModal,
  onSwitchToFocus,
  onOpenSaveModal,
  onDurationPopoverOpenChange,
  setCustomDurations,
}: TimerControlsProps) {
  const { isPipActive, togglePip } = usePip();

  return (
    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-wrap justify-center max-w-full">
      {/* Start / Pause / Resume Action Button */}
      <Button
        className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
        size="lg"
        variant="primary"
        onPress={onToggle}
      >
        {isRunning ? (
          <>
            <Pause className="size-5   fill-current" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="size-5 fill-current" />
            <span>{isPaused ? "Resume" : "Start"}</span>
          </>
        )}
      </Button>

      {/* Reset Current Cycle Button */}
      {hasStarted && (
        <Tooltip delay={150}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Reset Current Cycle"
              className="size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0"
              size="lg"
              variant="secondary"
              onPress={onReset}
            >
              <RotateCcw className="size-5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
            <span className="text-xs font-medium">Reset cycle</span>
          </Tooltip.Content>
        </Tooltip>
      )}

      {/* Skip Cycle Button (when in focus mode) */}
      {isFocus && hasStarted && (
        <Tooltip delay={150}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Skip Cycle"
              className="size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0"
              isDisabled={timeLeft <= 0}
              size="lg"
              variant="secondary"
              onPress={onOpenBreakModal}
            >
              <SkipForward className="size-5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
            <span className="text-xs font-medium">
              {timeLeft <= 0 ? "Time has passed" : "Skip cycle"}
            </span>
          </Tooltip.Content>
        </Tooltip>
      )}

      {/* Skip Break Button (when in break mode and break has started) */}
      {!isFocus && hasStarted && (
        <Tooltip delay={150}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Skip Break"
              className="size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0"
              isDisabled={timeLeft <= 0}
              size="lg"
              variant="secondary"
              onPress={onSwitchToFocus}
            >
              <SkipForward className="size-5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
            <span className="text-xs font-medium">
              {timeLeft <= 0 ? "Break finished" : "Skip break"}
            </span>
          </Tooltip.Content>
        </Tooltip>
      )}

      {/* Finish Session Button */}
      <Tooltip delay={150}>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            aria-label="Finish Session"
            className="size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0"
            size="lg"
            variant={isReadyToFinish ? "primary" : "secondary"}
            onPress={onOpenSaveModal}
          >
            <Flag className="size-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
          <span className="text-xs font-medium">Finish session</span>
        </Tooltip.Content>
      </Tooltip>

      {/* Duration Customization Popover */}
      <DurationsPopover
        durations={durations}
        isOpen={isDurationPopoverOpen}
        setCustomDurations={setCustomDurations}
        onOpenChange={onDurationPopoverOpenChange}
      />

      {/* Pop out Timer (Always on top Picture-in-Picture) */}
      <Tooltip delay={150}>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            aria-label={isPipActive ? "Close pop-out window" : "Pop out timer"}
            className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center p-0 transition-all ${
              isPipActive ? "bg-accent text-accent-foreground shadow-sm" : ""
            }`}
            size="lg"
            variant={isPipActive ? "primary" : "secondary"}
            onPress={togglePip}
          >
            <PictureInPicture2 className="size-5" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
          <span className="text-xs font-medium">
            {isPipActive ? "Close pop-out window" : "Pop out timer"}
          </span>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
