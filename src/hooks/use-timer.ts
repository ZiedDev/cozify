import { useState, useEffect, useRef, useCallback } from "react";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function useTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const remainingOnPauseRef = useRef<number>(TIMER_DURATIONS.focus);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const newTime = TIMER_DURATIONS[newMode];

    setTimeLeft(newTime);
    remainingOnPauseRef.current = newTime;
    targetEndTimeRef.current = null;
  }, []);

  const toggle = useCallback(() => {
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
      targetEndTimeRef.current =
        Date.now() + remainingOnPauseRef.current * 1000;
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    const initialTime = TIMER_DURATIONS[mode];

    setTimeLeft(initialTime);
    remainingOnPauseRef.current = initialTime;
    targetEndTimeRef.current = null;
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      setTimeLeft(Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning]);

  const hasActiveSession = isRunning || timeLeft !== TIMER_DURATIONS[mode];
  const isOvertime = timeLeft < 0;

  const absTime = Math.abs(timeLeft);
  const minutes = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    mode,
    timeLeft,
    isOvertime,
    hasActiveSession,
    formattedTime: isOvertime ? `+${timeString}` : timeString,
    isRunning,
    switchMode,
    toggle,
    reset,
  };
}
