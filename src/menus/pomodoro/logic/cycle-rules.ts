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
      ([k, s]) =>
        Number(k) > newTarget && (s.isCompleted || s.timeLeft < focusDuration),
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

export function calculateCyclesDone(
  mode: TimerMode,
  isCycleActive: boolean,
  currentCycle: number,
  completedCycles: number,
): number {
  return Math.max(
    1,
    isCycleActive && mode === "focus"
      ? Math.max(completedCycles, currentCycle)
      : completedCycles,
  );
}

export const calculateSprintsDone = calculateCyclesDone;

export function calculateCycleProgressPercent(
  mode: TimerMode,
  timeLeft: number,
  focusDuration: number,
): number {
  if (mode !== "focus" || focusDuration <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, ((focusDuration - timeLeft) / focusDuration) * 100),
  );
}

export const clampTargetCycles = (count: number): number =>
  Math.max(MIN_TARGET_CYCLES, Math.min(MAX_TARGET_CYCLES, count));

export const countCompletedCycles = (
  cycleStates: Record<number, { isCompleted: boolean }>,
): number => Object.values(cycleStates).filter((s) => s.isCompleted).length;

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

export function getNextFocusCycleAfterBreak(
  currentCycle: number,
  targetCycles: number,
  cycleStates: Record<number, { isCompleted: boolean }>,
): number {
  if (!cycleStates[currentCycle]?.isCompleted) return currentCycle;

  for (let c = currentCycle + 1; c <= targetCycles; c++) {
    if (!cycleStates[c]?.isCompleted) return c;
  }
  for (let c = 1; c < currentCycle; c++) {
    if (!cycleStates[c]?.isCompleted) return c;
  }

  return Math.min(targetCycles, currentCycle + 1);
}
