import { useState, useEffect } from "react";

import { CycleTracker } from "./components/cycle-tracker";
import { SaveProgressModal } from "./components/save-progress-modal";
import { TimerTabs } from "./components/timer-tabs";
import { TimerDisplay } from "./components/timer-display";
import { TimerControls } from "./components/timer-controls";
import { BreakModal } from "./components/break-modal";
import { InterruptAlert } from "./components/interrupt-alert";

import { useTimer } from "@/hooks/use-timer";
import { TimerMode } from "@/config/timer";

export function Timer() {
  const {
    mode,
    durations,
    formattedTime,
    timeLeft,
    isRunning,
    isOvertime,
    currentCycle,
    targetCycles,
    isSaveModalOpen,
    setIsSaveModalOpen,
    switchMode,
    toggle,
    addMinutes,
    finishCycleAndTakeBreak,
    skipBreak,
    setCustomDurations,
  } = useTimer();

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState<boolean>(false);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] =
    useState<boolean>(false);

  // Always close popovers when any modal or alert dialog is opened
  useEffect(() => {
    if (isBreakModalOpen || isSaveModalOpen || pendingAction !== null) {
      setIsDurationPopoverOpen(false);
    }
  }, [isBreakModalOpen, isSaveModalOpen, pendingAction]);

  const confirmOrRun = (action: () => void) => {
    setIsDurationPopoverOpen(false);
    const hasUnfinishedProgress =
      timeLeft > 0 && (isRunning || timeLeft < durations[mode]);

    if (hasUnfinishedProgress) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const isFocus = mode === "focus";
  const isPaused = !isRunning && (timeLeft !== durations[mode] || isOvertime);
  const hasStarted = isRunning || isPaused;
  const isReadyToFinish =
    currentCycle >= targetCycles && (timeLeft <= 0 || !isFocus);

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-xl mx-auto">
      {/* Interactive Cycle Tracker */}
      <CycleTracker />

      {/* Mode Switching Tabs */}
      <TimerTabs
        mode={mode}
        onSwitchMode={(newMode: TimerMode) => {
          if (newMode !== mode) confirmOrRun(() => switchMode(newMode));
        }}
      />

      {/* Main Large Timer Display */}
      <TimerDisplay formattedTime={formattedTime} isOvertime={isOvertime} />

      {/* Main Timer Controls Row */}
      <TimerControls
        durations={durations}
        hasStarted={hasStarted}
        isDurationPopoverOpen={isDurationPopoverOpen}
        isFocus={isFocus}
        isPaused={isPaused}
        isReadyToFinish={isReadyToFinish}
        isRunning={isRunning}
        setCustomDurations={setCustomDurations}
        timeLeft={timeLeft}
        onAddMinutes={addMinutes}
        onDurationPopoverOpenChange={setIsDurationPopoverOpen}
        onOpenBreakModal={() => {
          setIsDurationPopoverOpen(false);
          setIsBreakModalOpen(true);
        }}
        onOpenSaveModal={() => {
          setIsDurationPopoverOpen(false);
          setIsSaveModalOpen(true);
        }}
        onToggle={toggle}
      />

      {/* Spacebar Shortcut Hint */}
      <p className="text-xs text-muted/60 tracking-wider uppercase">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-surface border border-separator/40 text-muted">
          Space
        </kbd>{" "}
        to {isRunning ? "pause" : isPaused ? "resume" : "start"}
      </p>

      {/* Break Selection Modal */}
      <BreakModal
        durations={durations}
        isOpen={isBreakModalOpen}
        onOpenChange={setIsBreakModalOpen}
        onSelectBreak={(breakMode) => finishCycleAndTakeBreak(breakMode)}
        onSkipBreak={skipBreak}
      />

      {/* Session Interruption Alert Dialog */}
      <InterruptAlert
        mode={mode}
        pendingAction={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />

      {/* Save Session Progress Modal */}
      <SaveProgressModal
        isOpen={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
      />
    </div>
  );
}
