import { useRef } from "react";
import { NumberField, ProgressBar, Tooltip, Typography } from "@heroui/react";

import {
  calculateCycleProgressPercent,
  calculateSavedCycleProgressPercent,
} from "../logic/cycle-rules";
import { formatTimerDisplay } from "../logic/time-utils";

import { useTimer } from "@/hooks/use-timer";
import { MIN_TARGET_CYCLES, MAX_TARGET_CYCLES } from "@/config/timer";

interface CycleTrackerProps {
  onRequestJumpCycle?: (cycleNumber: number) => void;
  onRequestTargetChange?: (newTarget: number) => void;
}

export function CycleTracker({
  onRequestJumpCycle,
  onRequestTargetChange,
}: CycleTrackerProps) {
  const {
    mode,
    timeLeft,
    durations,
    currentCycle,
    targetCycles,
    cycleStates,
    setCurrentCycle,
    setTargetCycles,
  } = useTimer();
  const lastChangeTimeRef = useRef<number>(0);

  const handleCyclesChange = (val: number | undefined) => {
    if (typeof val !== "number" || isNaN(val)) return;

    const now = Date.now();

    // Guard against React Aria step timer + click event double-triggering
    if (now - lastChangeTimeRef.current < 150) {
      return;
    }
    lastChangeTimeRef.current = now;

    if (onRequestTargetChange) {
      onRequestTargetChange(val);
    } else {
      setTargetCycles(val);
    }
  };

  const handleCycleClick = (cycleNumber: number) => {
    if (onRequestJumpCycle) {
      onRequestJumpCycle(cycleNumber);
    } else {
      setCurrentCycle(cycleNumber);
    }
  };

  const currentProgressPercent = calculateCycleProgressPercent(
    mode,
    timeLeft,
    durations.focus,
  );

  const getBarWidthClass = () => {
    if (targetCycles > 10) return "w-5 sm:w-6 md:w-7";
    if (targetCycles > 6) return "w-7 sm:w-8 md:w-9";

    return "w-10 sm:w-12";
  };

  const barWidth = getBarWidthClass();

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Interactive Cycle Progress Bars with Tooltips */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center max-w-full px-2">
        {Array.from({ length: targetCycles }).map((_, index) => {
          const cycleNumber = index + 1;
          const isCurrent = cycleNumber === currentCycle;
          const cycleState = cycleStates[cycleNumber];
          const isCompleted = !!cycleState?.isCompleted;

          const cyclePercent =
            isCurrent && mode === "focus"
              ? currentProgressPercent
              : calculateSavedCycleProgressPercent(cycleState, durations.focus);

          const isPaused =
            !isCompleted &&
            cyclePercent > 0 &&
            !(isCurrent && mode === "focus");

          return (
            <Tooltip key={cycleNumber} delay={200}>
              <Tooltip.Trigger>
                <button
                  aria-label={`Cycle ${cycleNumber}: ${Math.round(cyclePercent)}%`}
                  className={`flex items-center cursor-pointer transition-all duration-200 focus-visible:outline-none rounded-full p-0.5 ${
                    isCurrent
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background scale-105"
                      : "hover:opacity-80"
                  }`}
                  type="button"
                  onClick={() => handleCycleClick(cycleNumber)}
                >
                  <ProgressBar
                    aria-label={`Cycle ${cycleNumber} progress`}
                    className={`${barWidth} gap-0`}
                    value={cyclePercent}
                  >
                    <ProgressBar.Track
                      className={`h-2.5 rounded-full border overflow-hidden transition-colors ${
                        isCurrent
                          ? "bg-surface border-accent/60 shadow-sm"
                          : isCompleted
                            ? "bg-surface-secondary border-accent/40"
                            : isPaused
                              ? "bg-surface-secondary border-accent/30"
                              : "bg-surface-secondary/70 border-separator/80"
                      }`}
                    >
                      <ProgressBar.Fill
                        className={`rounded-full transition-all duration-300 ${
                          isCurrent
                            ? "bg-accent shadow-sm"
                            : isCompleted
                              ? "bg-accent/80"
                              : isPaused
                                ? "bg-accent/60"
                                : "bg-accent/20"
                        }`}
                      />
                    </ProgressBar.Track>
                  </ProgressBar>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {isCurrent && mode === "focus"
                  ? `Cycle ${cycleNumber} (Active • ${Math.round(cyclePercent)}%)`
                  : isCompleted
                    ? `Cycle ${cycleNumber} (Completed • 100%)`
                    : isPaused && cycleState
                      ? `Cycle ${cycleNumber} (Paused • ${formatTimerDisplay(cycleState.timeLeft)} left)`
                      : `Cycle ${cycleNumber} (Not started)`}
              </Tooltip.Content>
            </Tooltip>
          );
        })}
      </div>

      {/* Cycle count and target stepper */}
      <div className="flex items-center gap-2.5">
        <Typography
          className="text-xs md:text-sm"
          color="muted"
          type="body-sm"
          weight="medium"
        >
          Cycle <strong className="text-foreground">{currentCycle}</strong> of
        </Typography>

        <NumberField
          aria-label="Target Cycles"
          className="w-24 h-8"
          maxValue={MAX_TARGET_CYCLES}
          minValue={MIN_TARGET_CYCLES}
          step={1}
          value={targetCycles}
          onChange={handleCyclesChange}
        >
          <NumberField.Group className="flex h-full items-center rounded-full bg-surface-secondary border border-separator/80 overflow-hidden shadow-sm">
            <NumberField.DecrementButton className="size-6 h-full text-muted hover:text-foreground" />
            <NumberField.Input className="flex-1 text-center text-xs font-bold text-foreground bg-transparent p-0 tabular-nums outline-none" />
            <NumberField.IncrementButton className="size-6 h-full text-muted hover:text-foreground" />
          </NumberField.Group>
        </NumberField>
      </div>
    </div>
  );
}
