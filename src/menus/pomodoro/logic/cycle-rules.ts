import {
  TimerMode,
  MIN_TARGET_CYCLES,
  MAX_TARGET_CYCLES,
} from "@/config/timer";

export function shouldPromptForTargetReduction(
  newTarget: number,
  currentTarget: number,
  currentCycle: number,
  isCurrentCycleActive: boolean,
  cycleStates: Record<number, { timeLeft: number; isCompleted: boolean }>,
  focusDuration: number,
): boolean {
  if (newTarget >= currentTarget) return false;

  return (
    Object.entries(cycleStates).some(
      ([cycleKey, cycleState]) =>
        Number(cycleKey) > newTarget &&
        (cycleState.isCompleted || cycleState.timeLeft < focusDuration),
    ) ||
    (currentCycle > newTarget && isCurrentCycleActive)
  );
}

export const calculateNextCycle = (
  currentCycle: number,
  maxTarget = MAX_TARGET_CYCLES,
): number => Math.min(maxTarget, currentCycle + 1);

export const determinePreferredBreak = (
  currentCycle: number,
  targetCycles: number,
): "shortBreak" | "longBreak" =>
  currentCycle % targetCycles === 0 ? "longBreak" : "shortBreak";

export const clampTargetCycles = (count: number): number =>
  Math.max(MIN_TARGET_CYCLES, Math.min(MAX_TARGET_CYCLES, count));

export function calculateCycleProgressPercent(
  mode: TimerMode,
  timeLeft: number,
  focusDuration: number,
  cycleState?: {
    timeLeft?: number;
    initialDuration?: number;
    focusElapsed?: number;
    isCompleted?: boolean;
  },
): number {
  if (mode !== "focus") return 0;
  if (cycleState?.isCompleted) return 100;

  const baseDuration = cycleState?.initialDuration || focusDuration;

  if (baseDuration <= 0) return 0;

  if (typeof cycleState?.focusElapsed === "number") {
    return Math.min(
      100,
      Math.max(0, (cycleState.focusElapsed / baseDuration) * 100),
    );
  }

  return Math.min(
    100,
    Math.max(0, ((baseDuration - Math.max(0, timeLeft)) / baseDuration) * 100),
  );
}

export function calculateSavedCycleProgressPercent(
  cycleState:
    | {
        timeLeft: number;
        isCompleted: boolean;
        initialDuration?: number;
        focusElapsed?: number;
      }
    | undefined,
  currentGlobalFocusDuration: number,
): number {
  if (!cycleState) return 0;
  if (cycleState.isCompleted) return 100;
  const baseDuration = cycleState.initialDuration || currentGlobalFocusDuration;

  if (baseDuration <= 0) return 0;

  if (typeof cycleState.focusElapsed === "number") {
    return Math.min(
      100,
      Math.max(0, (cycleState.focusElapsed / baseDuration) * 100),
    );
  }

  return Math.min(
    100,
    Math.max(
      0,
      ((baseDuration - Math.max(0, cycleState.timeLeft)) / baseDuration) * 100,
    ),
  );
}

export function isCycleFullyCompleted(
  cycleState:
    | {
        timeLeft: number;
        isCompleted: boolean;
        initialDuration?: number;
        focusElapsed?: number;
      }
    | undefined,
  fallbackDuration = 0,
): boolean {
  if (!cycleState) return false;
  if (cycleState.isCompleted) return true;

  const percent = calculateSavedCycleProgressPercent(
    cycleState,
    fallbackDuration,
  );

  return percent >= 100;
}

export function countCompletedCycles(
  cycleStates: Record<
    number,
    {
      timeLeft: number;
      isCompleted: boolean;
      initialDuration?: number;
      focusElapsed?: number;
    }
  >,
  currentCycle?: number,
  mode?: TimerMode,
  timeLeft?: number,
  focusDuration = 0,
): number {
  let count = 0;
  const entries = Object.entries(cycleStates);

  for (const [key, state] of entries) {
    const cycleNum = Number(key);
    const isCurrent = cycleNum === currentCycle && mode === "focus";

    if (isCurrent && typeof timeLeft === "number") {
      const activePercent = calculateCycleProgressPercent(
        mode,
        timeLeft,
        focusDuration,
        state,
      );

      if (activePercent >= 100) {
        count++;
      }
    } else if (isCycleFullyCompleted(state, focusDuration)) {
      count++;
    }
  }

  // If current active cycle reached 100% but was not yet saved into cycleStates
  if (
    currentCycle &&
    mode === "focus" &&
    !cycleStates[currentCycle] &&
    typeof timeLeft === "number"
  ) {
    const activePercent = calculateCycleProgressPercent(
      mode,
      timeLeft,
      focusDuration,
      undefined,
    );

    if (activePercent >= 100) {
      count++;
    }
  }

  return count;
}

export function calculateCyclesDone(
  mode: TimerMode,
  _isCycleActive: boolean,
  currentCycle: number,
  completedCycles: number,
  cycleStates?: Record<
    number,
    {
      timeLeft: number;
      isCompleted: boolean;
      initialDuration?: number;
      focusElapsed?: number;
    }
  >,
  timeLeft?: number,
  focusDuration?: number,
): number {
  if (cycleStates) {
    return countCompletedCycles(
      cycleStates,
      currentCycle,
      mode,
      timeLeft,
      focusDuration,
    );
  }

  return completedCycles;
}

export const calculateSprintsDone = calculateCyclesDone;

export function getNextFocusCycleAfterBreak(
  currentCycle: number,
  targetCycles: number,
  cycleStates: Record<number, { isCompleted: boolean }>,
): number {
  if (!cycleStates[currentCycle]?.isCompleted) return currentCycle;

  for (let cycleNum = currentCycle + 1; cycleNum <= targetCycles; cycleNum++) {
    if (!cycleStates[cycleNum]?.isCompleted) return cycleNum;
  }
  for (let cycleNum = 1; cycleNum < currentCycle; cycleNum++) {
    if (!cycleStates[cycleNum]?.isCompleted) return cycleNum;
  }

  return Math.min(targetCycles, currentCycle + 1);
}
