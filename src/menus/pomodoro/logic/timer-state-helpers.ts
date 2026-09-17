import {
  TimerMode,
  TimerDurations,
  DEFAULT_TIMER_DURATIONS,
  DEFAULT_TARGET_CYCLES,
} from "@/config/timer";

type TimerStatusParams = {
  mode: TimerMode;
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  currentCycle: number;
  completedCycles: number;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
  currentCycleState?: {
    timeLeft?: number;
    initialDuration?: number;
    focusElapsed?: number;
    overtimeElapsed?: number;
    isCompleted?: boolean;
  };
};

type DerivedTimerStatus = {
  isOvertime: boolean;
  isIdle: boolean;
  isPaused: boolean;
  isCycleActive: boolean;
  reachedCycles: number;
  hasActiveSession: boolean;
};

/**
 * Derives timer status flags from base parameters
 */
export function deriveTimerStatus(
  params: TimerStatusParams,
): DerivedTimerStatus {
  const isOvertime = params.timeLeft < 0;
  const isFocus = params.mode === "focus";
  const cycleState = params.currentCycleState;
  const focusElapsed = cycleState?.focusElapsed ?? 0;
  const isCompleted = !!cycleState?.isCompleted;

  // A focus cycle is idle if not running, not completed, zero overtime, and zero elapsed focus time
  const isIdle = isFocus
    ? !params.isRunning && focusElapsed === 0 && !isOvertime && !isCompleted
    : !params.isRunning && params.timeLeft === params.duration && !isOvertime;

  const isPaused = !params.isRunning && !isIdle && !isCompleted;
  const isBreak = !isFocus;
  const isCycleActive = params.isRunning || isPaused || isOvertime;

  const reachedCycles = isBreak
    ? Math.max(params.completedCycles, params.currentCycle - 1)
    : isCycleActive
      ? Math.max(params.completedCycles, params.currentCycle)
      : params.completedCycles;

  const hasActiveSession =
    params.accumulatedFocusSeconds > 0 ||
    params.accumulatedOvertimeSeconds > 0 ||
    params.completedCycles > 0 ||
    params.currentCycle > 1 ||
    params.isRunning ||
    focusElapsed > 0 ||
    isOvertime ||
    (isBreak && params.timeLeft < params.duration);

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
    {
      timeLeft: number;
      isCompleted: boolean;
      initialDuration?: number;
      focusElapsed?: number;
      overtimeElapsed?: number;
    }
  >,
  currentCycle: number,
  mode: TimerMode,
  currentRemainingTime: number,
  defaultFocusDuration: number,
  isRunning = false,
): number {
  let total = 0;

  // 1. Sum up all recorded cycles other than the active focus cycle
  for (const [cycleNumStr, state] of Object.entries(cycleStates)) {
    const cycleNum = Number(cycleNumStr);

    if (cycleNum === currentCycle && mode === "focus") {
      continue;
    }

    if (typeof state.focusElapsed === "number") {
      total += state.focusElapsed;
    } else if (state.isCompleted) {
      total += state.initialDuration || defaultFocusDuration;
    }
  }

  // 2. Add current active focus cycle
  if (mode === "focus") {
    const currentState = cycleStates[currentCycle];

    if (
      currentState?.isCompleted &&
      typeof currentState.focusElapsed === "number"
    ) {
      total += currentState.focusElapsed;
    } else if (currentState) {
      const initial = currentState.initialDuration || defaultFocusDuration;
      const effectiveTimeLeft = Math.max(0, currentRemainingTime);

      if (isRunning) {
        // While running, elapsed is the difference between initialDuration and remaining
        const liveElapsed = Math.min(
          initial,
          Math.max(0, initial - effectiveTimeLeft),
        );

        total += liveElapsed;
      } else {
        // When paused or idle, use recorded focusElapsed
        total += currentState.focusElapsed ?? 0;
      }
    }
  }

  return Math.max(0, Math.round(total));
}

/**
 * Calculates total overtime seconds across all cycles in epoch time
 */
export function calculateTotalOvertimeSeconds(
  cycleStates: Record<
    number,
    {
      timeLeft: number;
      isCompleted: boolean;
      initialDuration?: number;
      focusElapsed?: number;
      overtimeElapsed?: number;
    }
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

    if (typeof state.overtimeElapsed === "number") {
      overtime += state.overtimeElapsed;
    } else if (state.timeLeft < 0) {
      overtime += Math.abs(state.timeLeft);
    }
  }

  if (mode === "focus") {
    const currentState = cycleStates[currentCycle];
    const activeOvertime =
      currentRemainingTime < 0
        ? Math.abs(currentRemainingTime)
        : (currentState?.overtimeElapsed ?? 0);

    overtime += activeOvertime;
  }

  return Math.max(0, Math.round(overtime));
}

type CycleElapsedMetrics = {
  initialDuration: number;
  focusElapsed: number;
  overtimeElapsed: number;
};

/**
 * Calculates initialDuration, focusElapsed, and overtimeElapsed for a cycle
 */
export function calculateCycleElapsed(
  cycleState:
    | {
        initialDuration?: number;
        focusElapsed?: number;
        overtimeElapsed?: number;
        isCompleted?: boolean;
      }
    | undefined,
  currentRemaining: number,
  defaultDuration: number,
): CycleElapsedMetrics {
  const initialDuration = cycleState?.initialDuration || defaultDuration;

  if (
    cycleState?.isCompleted &&
    typeof cycleState?.focusElapsed === "number" &&
    currentRemaining <= 0
  ) {
    return {
      initialDuration,
      focusElapsed: cycleState.focusElapsed,
      overtimeElapsed: cycleState.overtimeElapsed ?? 0,
    };
  }

  const focusElapsed = Math.min(
    initialDuration,
    Math.max(0, initialDuration - Math.max(0, currentRemaining)),
  );
  const overtimeElapsed =
    currentRemaining < 0
      ? Math.abs(currentRemaining)
      : (cycleState?.overtimeElapsed ?? 0);

  return { initialDuration, focusElapsed, overtimeElapsed };
}
