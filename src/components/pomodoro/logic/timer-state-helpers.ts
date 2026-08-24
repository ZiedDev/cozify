import {
  TimerMode,
  TimerDurations,
  DEFAULT_TIMER_DURATIONS,
  DEFAULT_TARGET_CYCLES,
} from "@/config/timer";

export interface TimerStatusParams {
  mode: TimerMode;
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  currentCycle: number;
  completedCycles: number;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
}

export interface DerivedTimerStatus {
  isOvertime: boolean;
  isIdle: boolean;
  isPaused: boolean;
  isCycleActive: boolean;
  reachedCycles: number;
  hasActiveSession: boolean;
}

/**
 * Derives timer status flags from base parameters
 */
export function deriveTimerStatus(
  params: TimerStatusParams,
): DerivedTimerStatus {
  const isOvertime = params.timeLeft < 0;
  const isIdle =
    !params.isRunning && params.timeLeft === params.duration && !isOvertime;
  const isPaused = !params.isRunning && !isIdle;
  const isBreak = params.mode !== "focus";
  const isCycleActive = params.isRunning || isPaused || isOvertime || isBreak;
  const reachedCycles = isBreak
    ? Math.max(params.completedCycles, params.currentCycle - 1)
    : isCycleActive
      ? Math.max(params.completedCycles, params.currentCycle)
      : params.completedCycles;
  const hasActiveSession =
    isCycleActive ||
    params.accumulatedFocusSeconds > 0 ||
    params.completedCycles > 0 ||
    params.currentCycle > 1 ||
    isBreak;

  return {
    isOvertime,
    isIdle,
    isPaused,
    isCycleActive,
    reachedCycles,
    hasActiveSession,
  };
}

/**
 * Checks if timer settings differ from defaults
 */
export function hasCustomSettings(
  durations: TimerDurations,
  targetCycles: number,
): boolean {
  const areDurationsCustom =
    durations.focus !== DEFAULT_TIMER_DURATIONS.focus ||
    durations.shortBreak !== DEFAULT_TIMER_DURATIONS.shortBreak ||
    durations.longBreak !== DEFAULT_TIMER_DURATIONS.longBreak;

  const isTargetCustom = targetCycles !== DEFAULT_TARGET_CYCLES;

  return areDurationsCustom || isTargetCustom;
}
