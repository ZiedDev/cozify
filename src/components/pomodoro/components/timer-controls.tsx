import { Button } from "@heroui/react";
import { Play, Pause, Coffee, Flag, RotateCcw, Brain } from "lucide-react";

import { DurationsPopover } from "./durations-popover";

import { TimerDurations } from "@/config/timer";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isFocus: boolean;
  hasStarted: boolean;
  isReadyToFinish: boolean;
  durations: TimerDurations;
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
  isDurationPopoverOpen,
  onToggle,
  onReset,
  onOpenBreakModal,
  onSwitchToFocus,
  onOpenSaveModal,
  onDurationPopoverOpenChange,
  setCustomDurations,
}: TimerControlsProps) {
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
      )}

      {/* Take Break Button (when in focus mode) */}
      {isFocus && hasStarted && (
        <Button
          aria-label="Take Break"
          className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={onOpenBreakModal}
        >
          <Coffee className="size-5" />
          <span>Break</span>
        </Button>
      )}

      {/* Switch to Focus Button (when in break mode and break has started) */}
      {!isFocus && hasStarted && (
        <Button
          aria-label="Switch to Focus"
          className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={onSwitchToFocus}
        >
          <Brain className="size-5" />
          <span>Focus</span>
        </Button>
      )}

      {/* Finish Session Button */}
      <Button
        aria-label="Finish Session"
        className="px-6 sm:px-7 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
        size="lg"
        variant={isReadyToFinish ? "primary" : "secondary"}
        onPress={onOpenSaveModal}
      >
        <Flag className="size-5" />
        <span>Finish</span>
      </Button>

      {/* Duration Customization Popover */}
      <DurationsPopover
        durations={durations}
        isOpen={isDurationPopoverOpen}
        setCustomDurations={setCustomDurations}
        onOpenChange={onDurationPopoverOpenChange}
      />
    </div>
  );
}
