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
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
      {/* Start / Pause / Resume Action Button */}
      <Button
        className="px-7 sm:px-9 py-6 sm:py-7 rounded-2xl text-base sm:text-lg font-medium shadow-lg transition-transform active:scale-95 flex items-center gap-2"
        size="lg"
        variant="primary"
        onPress={onToggle}
      >
        {isRunning ? (
          <>
            <Pause className="size-5 sm:size-6 fill-current" />
            <span>Pause</span>
          </>
        ) : isPaused ? (
          <>
            <Play className="size-5 sm:size-6 fill-current" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <Play className="size-5 sm:size-6 fill-current" />
            <span>Start</span>
          </>
        )}
      </Button>

      {/* Reset Current Cycle Button */}
      {hasStarted && (
        <Button
          aria-label="Reset Current Cycle"
          className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={onReset}
        >
          <RotateCcw className="size-4" />
          <span>Reset</span>
        </Button>
      )}

      {/* Take Break Button (when in focus mode) */}
      {isFocus && hasStarted && (
        <Button
          aria-label="Take Break"
          className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={onOpenBreakModal}
        >
          <Coffee className="size-4" />
          <span>Break</span>
        </Button>
      )}

      {/* Switch to Focus Button (when in break mode and break has started) */}
      {!isFocus && hasStarted && (
        <Button
          aria-label="Switch to Focus"
          className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
          size="lg"
          variant="secondary"
          onPress={onSwitchToFocus}
        >
          <Brain className="size-4" />
          <span>Focus</span>
        </Button>
      )}

      {/* Finish Session Button */}
      <Button
        aria-label="Finish Session"
        className="px-3.5 sm:px-4 py-6 sm:py-7 rounded-2xl text-sm sm:text-base font-medium flex items-center gap-1.5"
        size="lg"
        variant={isReadyToFinish ? "primary" : "secondary"}
        onPress={onOpenSaveModal}
      >
        <Flag className="size-4 sm:size-5" />
        <span>Finish</span>
      </Button>

      {/* Ultra-Compact Duration Customization Popover */}
      <DurationsPopover
        durations={durations}
        isOpen={isDurationPopoverOpen}
        setCustomDurations={setCustomDurations}
        onOpenChange={onDurationPopoverOpenChange}
      />
    </div>
  );
}
