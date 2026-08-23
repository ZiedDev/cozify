import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { toast } from "@heroui/react";

import {
  TimerMode,
  TimerDurations,
  DEFAULT_TIMER_DURATIONS,
  DEFAULT_TARGET_CYCLES,
  MIN_TARGET_CYCLES,
  MAX_TARGET_CYCLES,
  MAX_DURATION_SECONDS,
} from "@/config/timer";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

interface PersistedState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  targetEndTime: number | null;
  currentCycle: number;
  targetCycles: number;
  durations: TimerDurations;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
}

export interface TimerContextValue {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  currentCycle: number;
  targetCycles: number;
  durations: TimerDurations;
  isOvertime: boolean;
  hasActiveSession: boolean;
  formattedTime: string;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  toggle: () => void;
  reset: () => void;
  switchMode: (newMode: TimerMode, autoStart?: boolean) => void;
  addMinutes: (minutes: number) => void;
  finishCycleAndTakeBreak: (breakMode?: "shortBreak" | "longBreak") => void;
  skipBreak: () => void;
  startNextCycle: () => void;
  startNewSession: () => void;
  discardSession: () => void;
  stopAndCelebrate: () => void;
  setTargetCycles: (cycles: number) => void;
  setCurrentCycle: (cycle: number) => void;
  setCustomDurations: (newDurations: Partial<TimerDurations>) => void;
}

export const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
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
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] =
    useState<number>(0);
  const [accumulatedOvertimeSeconds, setAccumulatedOvertimeSeconds] =
    useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const remainingOnPauseRef = useRef<number>(DEFAULT_TIMER_DURATIONS.focus);
  const hasTriggeredToastRef = useRef<boolean>(false);
  const lastTickTimeRef = useRef<number>(Date.now());

  // 1. Initial hydration from storage mediator
  useEffect(() => {
    async function hydrate() {
      const saved =
        await storageAdapter.getItem<Partial<PersistedState> | null>(
          STORAGE_KEYS.TIMER_STATE,
          null,
        );

      if (saved) {
        if (saved.mode) setMode(saved.mode);
        if (saved.durations) setDurations(saved.durations);
        if (saved.currentCycle) setCurrentCycleState(saved.currentCycle);
        if (saved.targetCycles) setTargetCyclesState(saved.targetCycles);
        if (saved.accumulatedFocusSeconds)
          setAccumulatedFocusSeconds(saved.accumulatedFocusSeconds);
        if (saved.accumulatedOvertimeSeconds)
          setAccumulatedOvertimeSeconds(saved.accumulatedOvertimeSeconds);

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

  // 2. Persist state changes minimally (remove storage when default/idle)
  useEffect(() => {
    if (!isHydrated) return;

    const areDurationsCustom =
      durations.focus !== DEFAULT_TIMER_DURATIONS.focus ||
      durations.shortBreak !== DEFAULT_TIMER_DURATIONS.shortBreak ||
      durations.longBreak !== DEFAULT_TIMER_DURATIONS.longBreak;

    const isTargetCustom = targetCycles !== DEFAULT_TARGET_CYCLES;

    const isActive =
      isRunning ||
      timeLeft !== durations[mode] ||
      accumulatedFocusSeconds > 0 ||
      accumulatedOvertimeSeconds > 0 ||
      currentCycle > 1 ||
      mode !== "focus";

    if (!isActive && !areDurationsCustom && !isTargetCustom) {
      storageAdapter.removeItem(STORAGE_KEYS.TIMER_STATE);

      return;
    }

    const stateToSave: Partial<PersistedState> = {};

    if (areDurationsCustom) stateToSave.durations = durations;
    if (isTargetCustom) stateToSave.targetCycles = targetCycles;

    if (isActive) {
      stateToSave.mode = mode;
      stateToSave.timeLeft = timeLeft;
      stateToSave.isRunning = isRunning;
      stateToSave.targetEndTime = targetEndTimeRef.current;
      stateToSave.currentCycle = currentCycle;
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
    targetCycles,
    durations,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
  ]);

  const switchMode = useCallback(
    (newMode: TimerMode, autoStart = false) => {
      toast.clear();
      setMode(newMode);
      hasTriggeredToastRef.current = false;
      const newTime = durations[newMode];

      setTimeLeft(newTime);
      remainingOnPauseRef.current = newTime;

      if (autoStart) {
        setIsRunning(true);
        lastTickTimeRef.current = Date.now();
        targetEndTimeRef.current = Date.now() + newTime * 1000;
      } else {
        setIsRunning(false);
        targetEndTimeRef.current = null;
      }
    },
    [durations],
  );

  const finishCycleAndTakeBreak = useCallback(
    (preferredBreak?: "shortBreak" | "longBreak") => {
      toast.clear();

      const nextBreakMode =
        preferredBreak ||
        (currentCycle % targetCycles === 0 ? "longBreak" : "shortBreak");

      switchMode(nextBreakMode, true);
    },
    [currentCycle, targetCycles, switchMode],
  );

  // Skip Break: Advances cycle (expanding 4/4 to 5/5) and sets Focus ready to start (NO auto-start)
  const skipBreak = useCallback(() => {
    toast.clear();

    if (currentCycle >= targetCycles) {
      const newTotal = Math.min(MAX_TARGET_CYCLES, targetCycles + 1);

      setTargetCyclesState(newTotal);
      setCurrentCycleState(newTotal);
    } else {
      if (mode !== "focus" || timeLeft <= 0) {
        setCurrentCycleState((prev) => Math.min(targetCycles, prev + 1));
      }
    }

    switchMode("focus", false);
  }, [currentCycle, targetCycles, mode, timeLeft, switchMode]);

  // Start Next Cycle: Advances cycle (expanding 4/4 to 5/5) and sets Focus ready to start
  const startNextCycle = useCallback(() => {
    toast.clear();

    if (currentCycle >= targetCycles) {
      const newTotal = Math.min(MAX_TARGET_CYCLES, targetCycles + 1);

      setTargetCyclesState(newTotal);
      setCurrentCycleState(newTotal);
    } else {
      setCurrentCycleState((prev) => Math.min(targetCycles, prev + 1));
    }

    switchMode("focus", false);
  }, [currentCycle, targetCycles, switchMode]);

  const startNewSession = useCallback(() => {
    toast.clear();
    setCurrentCycleState(1);
    setAccumulatedFocusSeconds(0);
    setAccumulatedOvertimeSeconds(0);
    switchMode("focus", false);
  }, [switchMode]);

  const discardSession = useCallback(() => {
    toast.clear();
    setIsSaveModalOpen(false);
    startNewSession();
  }, [startNewSession]);

  const stopAndCelebrate = useCallback(() => {
    toast.clear();
    setIsRunning(false);
    targetEndTimeRef.current = null;

    // Open Save Progress Modal manually when requested
    setIsSaveModalOpen(true);
  }, []);

  // 3. Active countdown interval with timestamp diffing and accumulator
  useEffect(() => {
    if (!isRunning) return;

    lastTickTimeRef.current = Date.now();

    const interval = setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      const now = Date.now();
      const elapsedSeconds = Math.round((now - lastTickTimeRef.current) / 1000);

      if (elapsedSeconds >= 1) {
        lastTickTimeRef.current = now;
        if (mode === "focus") {
          setAccumulatedFocusSeconds((prev) => prev + elapsedSeconds);
          if (
            targetEndTimeRef.current !== null &&
            now > targetEndTimeRef.current
          ) {
            setAccumulatedOvertimeSeconds((prev) => prev + elapsedSeconds);
          }
        }
      }

      const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);

      setTimeLeft(remaining);

      // Trigger official HeroUI persistent Toast on completion
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
            setCurrentCycleState((prev) => Math.min(targetCycles, prev + 1));

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
    finishCycleAndTakeBreak,
    startNextCycle,
    stopAndCelebrate,
  ]);

  // Clean Toggle: ALWAYS simply pauses or resumes without hijacking
  const toggle = useCallback(() => {
    toast.clear();
    if (isRunning) {
      setIsRunning(false);
      if (targetEndTimeRef.current !== null) {
        const remaining = Math.ceil(
          (targetEndTimeRef.current - Date.now()) / 1000,
        );

        remainingOnPauseRef.current = remaining;
        setTimeLeft(remaining);
      }
      targetEndTimeRef.current = null;
    } else {
      setIsRunning(true);
      lastTickTimeRef.current = Date.now();
      targetEndTimeRef.current =
        Date.now() + remainingOnPauseRef.current * 1000;
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    toast.clear();
    setIsRunning(false);
    hasTriggeredToastRef.current = false;
    const initialTime = durations[mode];

    setTimeLeft(initialTime);
    remainingOnPauseRef.current = initialTime;
    targetEndTimeRef.current = null;
  }, [durations, mode]);

  const addMinutes = useCallback((minutes: number) => {
    toast.clear();
    const additionalSeconds = minutes * 60;

    setTimeLeft((prev) =>
      Math.min(MAX_DURATION_SECONDS, prev + additionalSeconds),
    );
    remainingOnPauseRef.current = Math.min(
      MAX_DURATION_SECONDS,
      remainingOnPauseRef.current + additionalSeconds,
    );

    if (targetEndTimeRef.current !== null) {
      const now = Date.now();
      const currentRemaining = Math.max(0, targetEndTimeRef.current - now);
      const newRemaining = Math.min(
        MAX_DURATION_SECONDS * 1000,
        currentRemaining + additionalSeconds * 1000,
      );

      targetEndTimeRef.current = now + newRemaining;
    }
  }, []);

  const setTargetCycles = useCallback((count: number) => {
    toast.clear();
    const clamped = Math.max(
      MIN_TARGET_CYCLES,
      Math.min(MAX_TARGET_CYCLES, count),
    );

    setTargetCyclesState(clamped);
    setCurrentCycleState((prev) => Math.min(prev, clamped));
  }, []);

  const setCurrentCycle = useCallback(
    (cycle: number) => {
      toast.clear();
      const clamped = Math.max(1, Math.min(targetCycles, cycle));

      setCurrentCycleState(clamped);
    },
    [targetCycles],
  );

  const setCustomDurations = useCallback(
    (newDurations: Partial<TimerDurations>) => {
      toast.clear();
      setDurations((prev) => {
        const updated = { ...prev, ...newDurations };

        setTimeLeft((currentTime) => {
          if (!isRunning && currentTime === prev[mode]) {
            remainingOnPauseRef.current = updated[mode];

            return updated[mode];
          }

          return currentTime;
        });

        return updated;
      });
    },
    [isRunning, mode],
  );

  const hasActiveSession =
    isRunning || timeLeft !== durations[mode] || accumulatedFocusSeconds > 0;
  const isOvertime = timeLeft < 0;

  const absTime = Math.abs(timeLeft);
  const minutes = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const value: TimerContextValue = {
    mode,
    timeLeft,
    isRunning,
    currentCycle,
    targetCycles,
    durations,
    isOvertime,
    hasActiveSession,
    formattedTime: isOvertime ? `+${timeString}` : timeString,
    accumulatedFocusSeconds,
    accumulatedOvertimeSeconds,
    isSaveModalOpen,
    setIsSaveModalOpen,
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
