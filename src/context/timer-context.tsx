import {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
  useContext,
} from "react";
import { toast } from "@heroui/react";

import {
  TimerMode,
  TimerDurations,
  DEFAULT_TIMER_DURATIONS,
  DEFAULT_TARGET_CYCLES,
} from "@/config/timer";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";
import {
  TimerContextValue,
  PersistedTimerState,
  CycleState,
} from "@/components/pomodoro/types";
import {
  formatTimerDisplay,
  calculateAddedTime,
} from "@/components/pomodoro/logic/time-utils";
import {
  calculateNextCycle,
  determinePreferredBreak,
  clampTargetCycles,
  countCompletedCycles,
  getNextFocusCycleAfterBreak,
} from "@/components/pomodoro/logic/cycle-rules";
import {
  deriveTimerStatus,
  hasCustomSettings,
  calculateTotalFocusSeconds,
  calculateTotalOvertimeSeconds,
} from "@/components/pomodoro/logic/timer-state-helpers";

export type { TimerContextValue } from "@/components/pomodoro/types";

export const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [durations, setDurations] = useState<TimerDurations>(
    DEFAULT_TIMER_DURATIONS,
  );
  const [timeLeft, setTimeLeft] = useState<number>(
    DEFAULT_TIMER_DURATIONS.focus,
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentCycle, setCurrentCycleState] = useState<number>(1);
  const [targetCycles, setTargetCyclesState] = useState<number>(
    DEFAULT_TARGET_CYCLES,
  );
  const [cycleStates, setCycleStates] = useState<Record<number, CycleState>>(
    {},
  );
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const remainingOnPauseRef = useRef<number>(DEFAULT_TIMER_DURATIONS.focus);
  const hasTriggeredToastRef = useRef<boolean>(false);

  const completedCycles = countCompletedCycles(cycleStates);

  // Exact epoch-derived accumulated focus & overtime seconds (100% in sync with timer)
  const accumulatedFocusSeconds = useMemo(() => {
    return calculateTotalFocusSeconds(
      cycleStates,
      currentCycle,
      mode,
      timeLeft,
      durations.focus,
    );
  }, [cycleStates, currentCycle, mode, timeLeft, durations.focus]);

  const accumulatedOvertimeSeconds = useMemo(() => {
    return calculateTotalOvertimeSeconds(
      cycleStates,
      currentCycle,
      mode,
      timeLeft,
    );
  }, [cycleStates, currentCycle, mode, timeLeft]);

  // 1. Initial hydration from persistent storage
  useEffect(() => {
    async function hydrate() {
      const saved =
        await storageAdapter.getItem<Partial<PersistedTimerState> | null>(
          STORAGE_KEYS.TIMER_STATE,
          null,
        );

      if (saved) {
        if (saved.mode) setMode(saved.mode);
        if (saved.durations) setDurations(saved.durations);
        if (saved.currentCycle) setCurrentCycleState(saved.currentCycle);
        if (saved.targetCycles) setTargetCyclesState(saved.targetCycles);
        if (saved.cycleStates) setCycleStates(saved.cycleStates);

        const currentDurations = saved.durations || DEFAULT_TIMER_DURATIONS;
        const activeMode = saved.mode || "focus";
        const baseTime = currentDurations[activeMode];

        if (saved.isRunning && saved.targetEndTime) {
          const remaining = Math.ceil(
            (saved.targetEndTime - Date.now()) / 1000,
          );

          setTimeLeft(remaining);
          remainingOnPauseRef.current = remaining;
          targetEndTimeRef.current = saved.targetEndTime;
          setIsRunning(true);
        } else if (typeof saved.timeLeft === "number") {
          setTimeLeft(saved.timeLeft);
          remainingOnPauseRef.current = saved.timeLeft;
          targetEndTimeRef.current = null;
          setIsRunning(false);
        } else {
          setTimeLeft(baseTime);
          remainingOnPauseRef.current = baseTime;
        }
      }
      setIsHydrated(true);
    }
    hydrate();
  }, []);

  // Derived timer states via pure helper
  const status = deriveTimerStatus({
    mode,
    timeLeft,
    duration: durations[mode],
    isRunning,
    currentCycle,
    completedCycles,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
  });

  // 2. Persist state changes minimally
  useEffect(() => {
    if (!isHydrated) return;

    const isCustom = hasCustomSettings(durations, targetCycles);
    const hasAnyCycleProgress = Object.keys(cycleStates).length > 0;

    if (!status.hasActiveSession && !isCustom && !hasAnyCycleProgress) {
      storageAdapter.removeItem(STORAGE_KEYS.TIMER_STATE);

      return;
    }

    const stateToSave: Partial<PersistedTimerState> = {};

    if (
      durations.focus !== DEFAULT_TIMER_DURATIONS.focus ||
      durations.shortBreak !== DEFAULT_TIMER_DURATIONS.shortBreak ||
      durations.longBreak !== DEFAULT_TIMER_DURATIONS.longBreak
    ) {
      stateToSave.durations = durations;
    }
    if (targetCycles !== DEFAULT_TARGET_CYCLES) {
      stateToSave.targetCycles = targetCycles;
    }

    if (status.hasActiveSession || hasAnyCycleProgress) {
      stateToSave.mode = mode;
      stateToSave.timeLeft = timeLeft;
      stateToSave.isRunning = isRunning;
      stateToSave.targetEndTime = targetEndTimeRef.current;
      stateToSave.currentCycle = currentCycle;
      stateToSave.completedCycles = completedCycles;
      stateToSave.cycleStates = cycleStates;
      if (accumulatedFocusSeconds > 0)
        stateToSave.accumulatedFocusSeconds = accumulatedFocusSeconds;
      if (accumulatedOvertimeSeconds > 0)
        stateToSave.accumulatedOvertimeSeconds = accumulatedOvertimeSeconds;
    }

    storageAdapter.setItem(STORAGE_KEYS.TIMER_STATE, stateToSave);
  }, [
    isHydrated,
    mode,
    timeLeft,
    isRunning,
    currentCycle,
    completedCycles,
    targetCycles,
    durations,
    cycleStates,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    status.hasActiveSession,
  ]);

  // Pause helper: accurately freezes time at current second and updates cycle state
  const pause = useCallback(() => {
    toast.clear();
    if (isRunning) {
      const currentRemaining =
        targetEndTimeRef.current !== null
          ? Math.ceil((targetEndTimeRef.current - Date.now()) / 1000)
          : timeLeft;

      remainingOnPauseRef.current = currentRemaining;
      setTimeLeft(currentRemaining);
      targetEndTimeRef.current = null;
      setIsRunning(false);

      if (mode === "focus") {
        setCycleStates((prev) => ({
          ...prev,
          [currentCycle]: {
            timeLeft: currentRemaining,
            isCompleted:
              currentRemaining <= 0 || !!prev[currentCycle]?.isCompleted,
            initialDuration:
              prev[currentCycle]?.initialDuration || durations.focus,
          },
        }));
      }
    }
  }, [isRunning, timeLeft, mode, currentCycle, durations.focus]);

  // Start / Resume helper: resumes seamlessly from remainingOnPauseRef or state timeLeft
  const start = useCallback(() => {
    toast.clear();
    setIsRunning(true);
    const remaining =
      typeof remainingOnPauseRef.current === "number"
        ? remainingOnPauseRef.current
        : timeLeft;

    remainingOnPauseRef.current = remaining;
    targetEndTimeRef.current = Date.now() + remaining * 1000;
  }, [timeLeft]);

  // Clean Toggle between Start/Resume and Pause
  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  // Switch timer mode (Focus, Short Break, Long Break)
  const switchMode = useCallback(
    (newMode: TimerMode, autoStart = false) => {
      toast.clear();

      let activeCycleStates = cycleStates;
      let activeCycle = currentCycle;

      // If switching away from an active focus session, preserve current cycle progress
      if (mode === "focus" && newMode !== "focus") {
        const currentRemaining =
          targetEndTimeRef.current !== null
            ? Math.ceil((targetEndTimeRef.current - Date.now()) / 1000)
            : timeLeft;

        const isFinished = currentRemaining <= 0;
        const hasProgress = isRunning || currentRemaining < durations.focus;

        if (hasProgress || isFinished) {
          activeCycleStates = {
            ...cycleStates,
            [currentCycle]: {
              timeLeft: currentRemaining,
              isCompleted:
                isFinished || !!cycleStates[currentCycle]?.isCompleted,
              initialDuration:
                cycleStates[currentCycle]?.initialDuration || durations.focus,
            },
          };
          setCycleStates(activeCycleStates);
        }
      }

      // If transitioning from Break -> Focus, advance to next cycle if current cycle is already completed
      if (mode !== "focus" && newMode === "focus") {
        activeCycle = getNextFocusCycleAfterBreak(
          currentCycle,
          targetCycles,
          activeCycleStates,
        );
        if (activeCycle !== currentCycle) {
          setCurrentCycleState(activeCycle);
        }
      }

      setMode(newMode);
      hasTriggeredToastRef.current = false;

      // Determine initial time: for break modes use durations[newMode], for focus mode check cycleStates[activeCycle]
      let newTime = durations[newMode];

      if (newMode === "focus") {
        const savedCycle = activeCycleStates[activeCycle];

        newTime = savedCycle ? savedCycle.timeLeft : durations.focus;
      }

      setTimeLeft(newTime);
      remainingOnPauseRef.current = newTime;

      if (autoStart) {
        setIsRunning(true);
        targetEndTimeRef.current = Date.now() + newTime * 1000;
      } else {
        setIsRunning(false);
        targetEndTimeRef.current = null;
      }
    },
    [
      durations,
      mode,
      isRunning,
      timeLeft,
      currentCycle,
      targetCycles,
      cycleStates,
    ],
  );

  const finishCycleAndTakeBreak = useCallback(
    (preferredBreak?: "shortBreak" | "longBreak") => {
      toast.clear();
      const nextBreakMode =
        preferredBreak || determinePreferredBreak(currentCycle, targetCycles);

      // 1. Mark current cycle completed
      setCycleStates((prev) => ({
        ...prev,
        [currentCycle]: {
          timeLeft: 0,
          isCompleted: true,
          initialDuration:
            prev[currentCycle]?.initialDuration || durations.focus,
        },
      }));

      // 2. Advance to next cycle
      const next = calculateNextCycle(currentCycle);

      setCurrentCycleState(next);
      if (currentCycle >= targetCycles) {
        setTargetCyclesState(next);
      }

      // 3. Switch to break with autoStart
      setMode(nextBreakMode);
      hasTriggeredToastRef.current = false;
      const breakDuration = durations[nextBreakMode];

      setTimeLeft(breakDuration);
      remainingOnPauseRef.current = breakDuration;
      setIsRunning(true);
      targetEndTimeRef.current = Date.now() + breakDuration * 1000;
    },
    [currentCycle, targetCycles, durations],
  );

  // Skip Break: Sets Focus mode ready on appropriate cycle without destroying existing cycle progress
  const skipBreak = useCallback(() => {
    toast.clear();
    setMode("focus");
    hasTriggeredToastRef.current = false;

    const nextCycle = getNextFocusCycleAfterBreak(
      currentCycle,
      targetCycles,
      cycleStates,
    );

    if (nextCycle !== currentCycle) {
      setCurrentCycleState(nextCycle);
    }

    // Load saved or fresh time for active cycle
    const targetState = cycleStates[nextCycle];
    const newTime = targetState ? targetState.timeLeft : durations.focus;

    setTimeLeft(newTime);
    remainingOnPauseRef.current = newTime;
    setIsRunning(false);
    targetEndTimeRef.current = null;
  }, [currentCycle, targetCycles, durations.focus, cycleStates]);

  // Start Next Cycle: Sets Focus ready and starts timer
  const startNextCycle = useCallback(() => {
    toast.clear();
    switchMode("focus", true);
  }, [switchMode]);

  const startNewSession = useCallback(() => {
    toast.clear();
    setCycleStates({});
    setCurrentCycleState(1);
    setMode("focus");
    setIsRunning(false);
    targetEndTimeRef.current = null;
    hasTriggeredToastRef.current = false;
    setTimeLeft(durations.focus);
    remainingOnPauseRef.current = durations.focus;
    storageAdapter.removeItem(STORAGE_KEYS.TIMER_STATE);
  }, [durations.focus]);

  const discardSession = useCallback(() => {
    toast.clear();
    setIsSaveModalOpen(false);
    startNewSession();
  }, [startNewSession]);

  // Stop and celebrate: pauses the active timer without resetting cycle progress and opens save modal
  const stopAndCelebrate = useCallback(() => {
    toast.clear();
    if (isRunning) {
      const currentRemaining =
        targetEndTimeRef.current !== null
          ? Math.ceil((targetEndTimeRef.current - Date.now()) / 1000)
          : timeLeft;

      remainingOnPauseRef.current = currentRemaining;
      setTimeLeft(currentRemaining);
      targetEndTimeRef.current = null;
      setIsRunning(false);

      if (mode === "focus") {
        setCycleStates((prev) => ({
          ...prev,
          [currentCycle]: {
            timeLeft: currentRemaining,
            isCompleted:
              currentRemaining <= 0 || !!prev[currentCycle]?.isCompleted,
            initialDuration:
              prev[currentCycle]?.initialDuration || durations.focus,
          },
        }));
      }
    }
    setIsSaveModalOpen(true);
  }, [isRunning, timeLeft, mode, currentCycle, durations.focus]);

  // 3. Countdown interval with drift-free timestamp diffing against Epoch Time
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      const now = Date.now();
      const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);

      setTimeLeft(remaining);

      // Periodically update active cycle state
      if (mode === "focus") {
        setCycleStates((prev) => {
          if (prev[currentCycle]?.timeLeft === remaining) return prev;

          return {
            ...prev,
            [currentCycle]: {
              timeLeft: remaining,
              isCompleted: remaining <= 0 || !!prev[currentCycle]?.isCompleted,
              initialDuration:
                prev[currentCycle]?.initialDuration || durations.focus,
            },
          };
        });
      }

      // Trigger Toast on cycle finish
      if (remaining <= 0 && !hasTriggeredToastRef.current) {
        hasTriggeredToastRef.current = true;

        if (mode === "focus") {
          const isSessionComplete = currentCycle >= targetCycles;

          if (isSessionComplete) {
            toast("Session Goal Reached! 🏁", {
              description: `All ${targetCycles} cycles complete. Stop the timer to record and save your progress.`,
              variant: "accent",
              timeout: 0,
              actionProps: {
                children: "Stop & Save",
                onPress: () => stopAndCelebrate(),
              },
            });
          } else {
            toast("Cycle Finished!", {
              description: `Cycle ${currentCycle} of ${targetCycles} is done. Ready for a break?`,
              variant: "accent",
              timeout: 0,
              actionProps: {
                children: "Take Break",
                onPress: () => finishCycleAndTakeBreak(),
              },
            });
          }
        } else {
          toast("Break Finished!", {
            description: `Break is over. Ready for cycle ${currentCycle} of ${targetCycles}?`,
            variant: "accent",
            timeout: 0,
            actionProps: {
              children: "Start Focus",
              onPress: () => startNextCycle(),
            },
          });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    isRunning,
    mode,
    currentCycle,
    targetCycles,
    durations.focus,
    finishCycleAndTakeBreak,
    startNextCycle,
    stopAndCelebrate,
  ]);

  const reset = useCallback(() => {
    toast.clear();
    setIsRunning(false);
    hasTriggeredToastRef.current = false;
    const initialTime = durations[mode];

    setTimeLeft(initialTime);
    remainingOnPauseRef.current = initialTime;
    targetEndTimeRef.current = null;

    if (mode === "focus") {
      setCycleStates((prev) => ({
        ...prev,
        [currentCycle]: {
          timeLeft: initialTime,
          isCompleted: false,
          initialDuration: initialTime,
        },
      }));
    }
  }, [durations, mode, currentCycle]);

  const addMinutes = useCallback(
    (minutes: number) => {
      toast.clear();

      const currentRemaining =
        targetEndTimeRef.current !== null
          ? Math.ceil((targetEndTimeRef.current - Date.now()) / 1000)
          : timeLeft;

      const updated = calculateAddedTime(currentRemaining, minutes);

      setTimeLeft(updated);
      remainingOnPauseRef.current = updated;

      if (isRunning) {
        targetEndTimeRef.current = Date.now() + updated * 1000;
        hasTriggeredToastRef.current = updated <= 0;
      }

      if (mode === "focus") {
        setCycleStates((cyclePrev) => ({
          ...cyclePrev,
          [currentCycle]: {
            timeLeft: updated,
            isCompleted: updated <= 0 || !!cyclePrev[currentCycle]?.isCompleted,
            initialDuration: Math.max(
              updated,
              cyclePrev[currentCycle]?.initialDuration || durations.focus,
            ),
          },
        }));
      }
    },
    [isRunning, timeLeft, mode, currentCycle, durations.focus],
  );

  const setTargetCycles = useCallback(
    (count: number) => {
      toast.clear();
      const clamped = clampTargetCycles(count);

      setTargetCyclesState(clamped);

      // Clean up cycle progress for any cycles beyond the new target
      setCycleStates((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([k]) => Number(k) <= clamped),
        ),
      );

      // If current cycle was beyond the new target, move to clamped cycle
      setCurrentCycleState((prevCycle) => {
        if (prevCycle > clamped) {
          const targetState = cycleStates[clamped];
          const targetTime = targetState
            ? targetState.timeLeft
            : durations.focus;

          setTimeLeft(targetTime);
          remainingOnPauseRef.current = targetTime;
          setIsRunning(false);
          targetEndTimeRef.current = null;

          return clamped;
        }

        return prevCycle;
      });
    },
    [durations.focus, cycleStates],
  );

  // Jump to specific cycle: saves current cycle progress and seamlessly loads target cycle's paused state!
  const setCurrentCycle = useCallback(
    (targetCycle: number) => {
      toast.clear();
      const clamped = Math.max(1, Math.min(targetCycles, targetCycle));

      // 1. Freeze and preserve current cycle state if in focus mode
      let latestCycleStates = cycleStates;

      if (mode === "focus") {
        const currentRemaining =
          targetEndTimeRef.current !== null
            ? Math.ceil((targetEndTimeRef.current - Date.now()) / 1000)
            : timeLeft;

        latestCycleStates = {
          ...cycleStates,
          [currentCycle]: {
            timeLeft: currentRemaining,
            isCompleted:
              currentRemaining <= 0 || !!cycleStates[currentCycle]?.isCompleted,
            initialDuration:
              cycleStates[currentCycle]?.initialDuration || durations.focus,
          },
        };
        setCycleStates(latestCycleStates);
      }

      // 2. Load target cycle's saved state (or focus duration if unstarted)
      const targetState = latestCycleStates[clamped];
      const targetTime = targetState ? targetState.timeLeft : durations.focus;

      setCurrentCycleState(clamped);
      setMode("focus");
      setIsRunning(false);
      targetEndTimeRef.current = null;
      hasTriggeredToastRef.current = targetTime <= 0;

      setTimeLeft(targetTime);
      remainingOnPauseRef.current = targetTime;
    },
    [targetCycles, mode, currentCycle, timeLeft, cycleStates, durations.focus],
  );

  const setCustomDurations = useCallback(
    (newDurations: Partial<TimerDurations>) => {
      toast.clear();
      setDurations((prev) => {
        const updated = { ...prev, ...newDurations };

        // Only update current timer if the current session is unstarted / idle
        const currentSavedState = cycleStates[currentCycle];
        const isCurrentFocusUntouched =
          !currentSavedState ||
          (!currentSavedState.isCompleted &&
            currentSavedState.timeLeft === prev.focus);

        setTimeLeft((currentTime) => {
          if (!isRunning) {
            if (mode === "focus" && isCurrentFocusUntouched) {
              remainingOnPauseRef.current = updated.focus;

              return updated.focus;
            }
            if (mode !== "focus" && currentTime === prev[mode]) {
              remainingOnPauseRef.current = updated[mode];

              return updated[mode];
            }
          }

          return currentTime;
        });

        return updated;
      });
    },
    [isRunning, mode, currentCycle, cycleStates],
  );

  const formattedTime = formatTimerDisplay(timeLeft);

  const value: TimerContextValue = {
    mode,
    timeLeft,
    isRunning,
    isPaused: status.isPaused,
    isIdle: status.isIdle,
    isOvertime: status.isOvertime,
    isCycleActive: status.isCycleActive,
    reachedCycles: status.reachedCycles,
    currentCycle,
    completedCycles,
    targetCycles,
    durations,
    cycleStates,
    hasActiveSession: status.hasActiveSession,
    formattedTime,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    isSaveModalOpen,
    setIsSaveModalOpen,
    start,
    pause,
    toggle,
    reset,
    switchMode,
    addMinutes,
    finishCycleAndTakeBreak,
    skipBreak,
    startNextCycle,
    startNewSession,
    discardSession,
    stopAndCelebrate,
    setTargetCycles,
    setCurrentCycle,
    setCustomDurations,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }

  return context;
}
