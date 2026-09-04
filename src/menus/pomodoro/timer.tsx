import { useState, useEffect } from "react";
import { Typography, Kbd } from "@heroui/react";

import { CycleTracker } from "./components/cycle-tracker";
import { SaveProgressModal } from "./components/save-progress-modal";
import { TimerTabs } from "./components/timer-tabs";
import { TimerDisplay } from "./components/timer-display";
import { TimerControls } from "./components/timer-controls";
import { BreakModal } from "./components/break-modal";
import {
  InterruptAlert,
  ConfirmationState,
} from "./components/interrupt-alert";
import { formatDurationLabel } from "./logic/time-utils";
import { shouldPromptForTargetReduction } from "./logic/cycle-rules";

import { useTimer } from "@/hooks/use-timer";
import { TimerMode } from "@/config/timer";

export function Timer() {
  const {
    mode,
    durations,
    formattedTime,
    timeLeft,
    isRunning,
    isPaused,
    isIdle,
    isOvertime,
    currentCycle,
    completedCycles,
    targetCycles,
    cycleStates,
    isSaveModalOpen,
    setIsSaveModalOpen,
    switchMode,
    toggle,
    addMinutes,
    finishCycleAndTakeBreak,
    finishCycleAndSkipToNext,
    skipBreak,
    setCustomDurations,
    stopAndCelebrate,
    setCurrentCycle,
    setTargetCycles,
    reset,
  } = useTimer();

  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );
  const [isBreakModalOpen, setIsBreakModalOpen] = useState<boolean>(false);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] =
    useState<boolean>(false);

  // Always close popovers when any modal or alert dialog is opened
  useEffect(() => {
    if (isBreakModalOpen || isSaveModalOpen || confirmation !== null) {
      setIsDurationPopoverOpen(false);
    }
  }, [isBreakModalOpen, isSaveModalOpen, confirmation]);

  // Automatically close skip modal if time has already passed / time is over
  useEffect(() => {
    if (timeLeft <= 0 && isBreakModalOpen) {
      setIsBreakModalOpen(false);
    }
  }, [timeLeft, isBreakModalOpen]);

  // Spacebar toggle shortcut
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

  const handleSwitchMode = (newMode: TimerMode) => {
    if (newMode === mode) return;
    setIsDurationPopoverOpen(false);

    if (isRunning) {
      if (mode === "focus") {
        setConfirmation({
          title: `Switch to ${newMode === "shortBreak" ? "Short Break" : "Long Break"}?`,
          description: `Your progress on Cycle ${currentCycle} will be paused and saved so you can resume it later.`,
          confirmLabel: "Pause & Switch",
          confirmVariant: "primary",
          onConfirm: () => switchMode(newMode),
        });
      } else {
        setConfirmation({
          title: "End Break Early?",
          description:
            "Your break timer is running. Switching to focus will end your break and prepare your focus cycle.",
          confirmLabel: "End Break & Focus",
          confirmVariant: "primary",
          onConfirm: () => switchMode(newMode),
        });
      }

      return;
    }

    switchMode(newMode);
  };

  const handleRequestJumpCycle = (cycleNumber: number) => {
    if (cycleNumber === currentCycle && mode === "focus") return;
    setIsDurationPopoverOpen(false);

    if (isRunning) {
      setConfirmation({
        title:
          mode === "focus"
            ? `Jump to Cycle ${cycleNumber}?`
            : `End Break & Jump to Cycle ${cycleNumber}?`,
        description:
          mode === "focus"
            ? `Your progress on Cycle ${currentCycle} will be paused and saved so you can resume it anytime.`
            : `Your break will end and you will jump to Cycle ${cycleNumber}.`,
        confirmLabel: `Jump to Cycle ${cycleNumber}`,
        confirmVariant: "primary",
        onConfirm: () => setCurrentCycle(cycleNumber),
      });

      return;
    }

    setCurrentCycle(cycleNumber);
  };

  const handleRequestReset = () => {
    setIsDurationPopoverOpen(false);

    setConfirmation({
      title:
        mode === "focus"
          ? `Reset Cycle ${currentCycle}?`
          : "Reset Break Timer?",
      description:
        mode === "focus"
          ? `This will reset Cycle ${currentCycle} back to ${formatDurationLabel(durations.focus)} and clear its saved progress.`
          : `This will reset your break timer back to ${formatDurationLabel(durations[mode])}.`,
      confirmLabel: mode === "focus" ? "Reset Cycle" : "Reset Break",
      confirmVariant: "danger-soft",
      onConfirm: () => reset(),
    });
  };

  const handleRequestTargetChange = (newTarget: number) => {
    if (newTarget === targetCycles) return;
    setIsDurationPopoverOpen(false);

    if (
      !shouldPromptForTargetReduction(
        newTarget,
        targetCycles,
        currentCycle,
        !isIdle,
        cycleStates,
        durations.focus,
      )
    ) {
      setTargetCycles(newTarget);

      return;
    }

    // When reducing target cycles will clear actual progress or cut off active cycle, prompt warning
    setConfirmation({
      title: `Reduce Goal to ${newTarget} ${newTarget === 1 ? "Cycle" : "Cycles"}?`,
      description: `Reducing to ${newTarget} cycles will remove cycles beyond cycle ${newTarget} and discard their saved progress. Are you sure?`,
      confirmLabel: "Reduce & Clear",
      confirmVariant: "danger-soft",
      onConfirm: () => setTargetCycles(newTarget),
    });
  };

  const isFocus = mode === "focus";
  const isReadyToFinish =
    (completedCycles >= targetCycles && (!isFocus || timeLeft <= 0)) ||
    (currentCycle >= targetCycles && isFocus && timeLeft <= 0);

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-5 md:gap-7 w-full max-w-lg md:max-w-xl mx-auto px-2 sm:px-4 py-1 select-none">
      {/* Interactive Cycle Tracker */}
      <CycleTracker
        onRequestJumpCycle={handleRequestJumpCycle}
        onRequestTargetChange={handleRequestTargetChange}
      />

      {/* Mode Switching Tabs */}
      <TimerTabs mode={mode} onSwitchMode={handleSwitchMode} />

      {/* Main Large Timer Display with +/- buttons */}
      <TimerDisplay
        formattedTime={formattedTime}
        isOvertime={isOvertime}
        timeLeft={timeLeft}
        onAddMinutes={addMinutes}
      />

      {/* Main Timer Controls Row */}
      <TimerControls
        durations={durations}
        hasStarted={!isIdle}
        isDurationPopoverOpen={isDurationPopoverOpen}
        isFocus={isFocus}
        isPaused={isPaused}
        isReadyToFinish={isReadyToFinish}
        isRunning={isRunning}
        setCustomDurations={setCustomDurations}
        timeLeft={timeLeft}
        onDurationPopoverOpenChange={setIsDurationPopoverOpen}
        onOpenBreakModal={() => {
          if (timeLeft <= 0) return;
          setIsDurationPopoverOpen(false);
          setIsBreakModalOpen(true);
        }}
        onOpenSaveModal={() => {
          setIsDurationPopoverOpen(false);
          stopAndCelebrate();
        }}
        onReset={handleRequestReset}
        onSwitchToFocus={() => {
          if (timeLeft <= 0) return;
          skipBreak();
        }}
        onToggle={toggle}
      />

      {/* Spacebar Shortcut Hint */}
      <Typography
        className="text-[10px] sm:text-xs opacity-60 r uppercase"
        color="muted"
        type="body-xs"
      >
        Press{" "}
        <Kbd className="px-1.5 py-0.5 rounded bg-surface border border-separator/40 text-muted">
          Space
        </Kbd>{" "}
        to {isRunning ? "pause" : isPaused ? "resume" : "start"}
      </Typography>

      {/* Break Selection Modal */}
      <BreakModal
        currentCycle={currentCycle}
        durations={durations}
        isOpen={isBreakModalOpen}
        timeLeft={timeLeft}
        timeUsed={Math.max(
          0,
          (cycleStates[currentCycle]?.initialDuration || durations.focus) -
            timeLeft,
        )}
        onOpenChange={setIsBreakModalOpen}
        onSelectBreak={(breakMode) => finishCycleAndTakeBreak(breakMode)}
        onSkipBreak={finishCycleAndSkipToNext}
      />

      {/* Unified Interruption & Cycle Collision Alert Dialog */}
      <InterruptAlert
        confirmation={confirmation}
        onCancel={() => setConfirmation(null)}
      />

      {/* Save Session Progress Modal */}
      <SaveProgressModal
        isOpen={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
      />
    </div>
  );
}
