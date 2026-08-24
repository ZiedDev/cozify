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

/**
 * Calculates total exact accumulated focus seconds across all cycles in epoch time
 */
export function calculateTotalFocusSeconds(
  cycleStates: Record<
    number,
    { timeLeft: number; isCompleted: boolean; initialDuration?: number }
  >,
  currentCycle: number,
  mode: TimerMode,
  currentRemainingTime: number,
  defaultFocusDuration: number,
): number {
  let total = 0;

  // 1. Sum up all recorded cycles other than the active focus cycle
  for (const [cycleNumStr, state] of Object.entries(cycleStates)) {
    const cycleNum = Number(cycleNumStr);
    if (cycleNum === currentCycle && mode === "focus") {
      continue;
    }
    const initial = state.initialDuration || defaultFocusDuration;
    if (state.isCompleted) {
      total += Math.max(initial, initial - state.timeLeft);
    } else {
      total += Math.max(0, initial - state.timeLeft);
    }
  }

  // 2. Add current active focus cycle
  if (mode === "focus") {
    const currentState = cycleStates[currentCycle];
    const initial = currentState?.initialDuration || defaultFocusDuration;
    total += Math.max(0, initial - currentRemainingTime);
  }

  return Math.max(0, Math.round(total));
}

/**
 * Calculates total overtime seconds across all cycles in epoch time
 */
export function calculateTotalOvertimeSeconds(
  cycleStates: Record<
    number,
    { timeLeft: number; isCompleted: boolean; initialDuration?: number }
  >,
  currentCycle: number,
  mode: TimerMode,
  currentRemainingTime: number,
): number {
  let overtime = 0;

  for (const [cycleNumStr, state] of Object.entries(cycleStates)) {
    const cycleNum = Number(cycleNumStr);
    if (cycleNum === currentCycle && mode === "focus") {
      continue;
    }
    if (state.timeLeft < 0) {
      overtime += Math.abs(state.timeLeft);
    }
  }

  if (mode === "focus" && currentRemainingTime < 0) {
    overtime += Math.abs(currentRemainingTime);
  }

  return Math.max(0, Math.round(overtime));
}
