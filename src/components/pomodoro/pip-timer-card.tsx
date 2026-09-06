import { Button, Typography } from "@heroui/react";
import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";

import { RollingText } from "@/components/ui/rolling-text";
import { BackgroundView } from "@/components/theme/background-view";
import { useTimer } from "@/hooks/use-timer";
import { TIMER_MODES, TimerMode } from "@/config/timer";
import {
  calculateCycleProgressPercent,
  calculateSavedCycleProgressPercent,
} from "@/menus/pomodoro/logic/cycle-rules";

export function PipTimerCard() {
  const {
    mode,
    formattedTime,
    timeLeft,
    durations,
    isRunning,
    isPaused,
    isIdle,
    isOvertime,
    currentCycle,
    targetCycles,
    cycleStates,
    toggle,
    reset,
    switchMode,
    addMinutes,
    setCurrentCycle,
  } = useTimer();

  const currentProgressPercent = calculateCycleProgressPercent(
    mode,
    timeLeft,
    durations.focus,
  );

  const getPipBarWidthClass = (count: number) => {
    if (count > 12) return "w-3 sm:w-4";
    if (count > 8) return "w-4 sm:w-5";
    if (count > 5) return "w-5 sm:w-6";

    return "w-7 sm:w-8";
  };

  const barWidth = getPipBarWidthClass(targetCycles);

  return (
    <div className="group relative h-screen w-screen bg-background text-foreground flex flex-col items-center justify-center select-none overflow-hidden font-sans p-3 box-border text-center">
      <BackgroundView />

      {/* 1. Mode Switcher (Matching original TimerTabs pill style - only appears on hover) */}
      <div className="absolute top-2.5 left-0 right-0 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="inline-flex items-center rounded-full bg-surface/85 backdrop-blur-md p-0.5 border border-separator/40 text-xs shadow-md">
          {TIMER_MODES.map((m) => {
            const isSelected = mode === m.id;

            return (
              <button
                key={m.id}
                className={`h-7 rounded-full px-3.5 text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-surface/60"
                }`}
                type="button"
                onClick={() => switchMode(m.id as TimerMode)}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Centered Timer Display (Always visible, centered) */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full my-auto">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full">
          {/* Minus 5 mins button (Only appears on hover) */}
          <Button
            isIconOnly
            aria-label="Subtract 5 minutes"
            className="shrink-0 size-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto text-muted hover:text-foreground hover:bg-surface/80"
            size="sm"
            variant="ghost"
            onPress={() => addMinutes(-5)}
          >
            <Minus className="size-4" />
          </Button>

          {/* Large Centered Time Digits */}
          <Typography
            aria-label={formattedTime}
            className={`font-sans text-6xl xs:text-7xl sm:text-8xl tracking-tight tabular-nums leading-none transition-colors flex items-center justify-center ${
              isOvertime ? "text-accent" : "text-foreground"
            }`}
            type="h1"
            weight="medium"
          >
            <RollingText triggerKey={mode} value={formattedTime} />
          </Typography>

          {/* Plus 5 mins button (Only appears on hover) */}
          <Button
            isIconOnly
            aria-label="Add 5 minutes"
            className="shrink-0 size-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto text-muted hover:text-foreground hover:bg-surface/80"
            size="sm"
            variant="ghost"
            onPress={() => addMinutes(5)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Minutes and Seconds Indicators (Exact match of TimerDisplay) */}
        <div className="flex items-center justify-between w-full max-w-48 px-3 text-[9px] font-semibold uppercase tracking-wider text-muted mt-1">
          <Typography
            className="text-[9px] uppercase font-semibold tracking-wider opacity-70"
            color="muted"
            type="body-xs"
          >
            minutes
          </Typography>
          <Typography
            className="text-[9px] uppercase font-semibold tracking-wider opacity-70"
            color="muted"
            type="body-xs"
          >
            seconds
          </Typography>
        </div>

        {/* Mini Cycle Tracker (Mini version of original CycleTracker pill progress bars) */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-center flex-wrap max-w-full mt-2.5 px-3">
          {Array.from({ length: targetCycles }).map((_, index) => {
            const cycleNumber = index + 1;
            const isCurrent = cycleNumber === currentCycle;
            const cycleState = cycleStates[cycleNumber];
            const isCompleted = !!cycleState?.isCompleted;

            const cyclePercent =
              isCurrent && mode === "focus"
                ? currentProgressPercent
                : calculateSavedCycleProgressPercent(
                    cycleState,
                    durations.focus,
                  );

            return (
              <button
                key={cycleNumber}
                aria-label={`Cycle ${cycleNumber}: ${Math.round(cyclePercent)}%`}
                className={`flex items-center cursor-pointer transition-all focus-visible:outline-none rounded-full p-0.5 ${
                  isCurrent
                    ? "ring-1 ring-accent ring-offset-1 ring-offset-background scale-105"
                    : "hover:opacity-80"
                }`}
                type="button"
                onClick={() => setCurrentCycle(cycleNumber)}
              >
                <div
                  className={`${barWidth} h-1.5 rounded-full border overflow-hidden transition-colors ${
                    isCurrent
                      ? "bg-surface border-accent/60 shadow-xs"
                      : isCompleted
                        ? "bg-surface-secondary border-accent/40"
                        : "bg-surface-secondary/70 border-separator/80"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                      isCurrent
                        ? "bg-accent shadow-xs"
                        : isCompleted
                          ? "bg-accent/80"
                          : "bg-accent/20"
                    }`}
                    style={{ width: `${Math.round(cyclePercent)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Controls Row (Play/Pause + Reset - only appears on hover) */}
      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl">
          {/* Main Action Button */}
          <Button
            className="px-5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs"
            size="sm"
            variant="primary"
            onPress={toggle}
          >
            {isRunning ? (
              <>
                <Pause className="size-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>{isPaused ? "Resume" : "Start"}</span>
              </>
            )}
          </Button>

          {/* Reset Current Cycle Button */}
          {!isIdle && (
            <Button
              isIconOnly
              aria-label="Reset Current Cycle"
              className="py-2 rounded-xl flex items-center justify-center p-0 text-muted hover:text-foreground"
              size="sm"
              variant="secondary"
              onPress={reset}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
