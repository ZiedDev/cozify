import {
  TimerMode,
  MIN_TARGET_CYCLES,
  MAX_TARGET_CYCLES,
} from "@/config/timer";

/**
 * Checks if reducing target cycles will discard progress or collide with an active cycle
 */
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

/**
 * Computes next cycle number clamped to maximum target cycles
 */
export function calculateNextCycle(
  currentCycle: number,
  maxTarget = MAX_TARGET_CYCLES,
): number {
  return Math.min(maxTarget, currentCycle + 1);
}

/**
 * Determines whether a short or long break should be taken
 */
export function determinePreferredBreak(
  currentCycle: number,
  targetCycles: number,
): "shortBreak" | "longBreak" {
  return currentCycle % targetCycles === 0 ? "longBreak" : "shortBreak";
}

/**
 * Calculates cycles done for session progress logging
 */
export function calculateCyclesDone(
  mode: TimerMode,
  isCycleActive: boolean,
  currentCycle: number,
  completedCycles: number,
): number {
  const hasStartedFocus = isCycleActive && mode === "focus";

  return Math.max(
    1,
    hasStartedFocus ? Math.max(completedCycles, currentCycle) : completedCycles,
  );
}

// Backward compatibility alias
export const calculateSprintsDone = calculateCyclesDone;

/**
 * Calculates current progress percentage of an active focus cycle
 */
export function calculateCycleProgressPercent(
  mode: TimerMode,
  timeLeft: number,
  focusDuration: number,
): number {
  if (mode !== "focus" || focusDuration <= 0) return 0;
  const elapsed = Math.max(0, focusDuration - timeLeft);

  return Math.min(100, Math.max(0, (elapsed / focusDuration) * 100));
}

/**
 * Clamps target cycles value within allowed bounds
 */
export function clampTargetCycles(count: number): number {
  return Math.max(MIN_TARGET_CYCLES, Math.min(MAX_TARGET_CYCLES, count));
}

/**
 * Counts total completed cycles from cycle states map
 */
export function countCompletedCycles(
  cycleStates: Record<number, { isCompleted: boolean }>,
): number {
  return Object.values(cycleStates).filter((s) => s.isCompleted).length;
}

/**
 * Calculates progress percentage for a specific cycle using its own initial duration
 */
export function calculateSavedCycleProgressPercent(
  cycleState:
    | { timeLeft: number; isCompleted: boolean; initialDuration?: number }
    | undefined,
  currentGlobalFocusDuration: number,
): number {
  if (!cycleState) return 0;
  if (cycleState.isCompleted) return 100;
  const baseDuration = cycleState.initialDuration || currentGlobalFocusDuration;

  if (baseDuration <= 0) return 0;
  const elapsed = Math.max(0, baseDuration - cycleState.timeLeft);

  return Math.min(100, Math.max(0, (elapsed / baseDuration) * 100));
}

/**
 * Finds the next appropriate focus cycle when transitioning from a break.
 * If the current cycle is already completed, advances to the next cycle (or next uncompleted cycle).
 */
export function getNextFocusCycleAfterBreak(
  currentCycle: number,
  targetCycles: number,
  cycleStates: Record<number, { isCompleted: boolean }>,
): number {
  if (!cycleStates[currentCycle]?.isCompleted) return currentCycle;

  // Next cycle after currentCycle
  for (let c = currentCycle + 1; c <= targetCycles; c++) {
    if (!cycleStates[c]?.isCompleted) return c;
  }
  // Earlier uncompleted cycle
  for (let c = 1; c < currentCycle; c++) {
    if (!cycleStates[c]?.isCompleted) return c;
  }

  return Math.min(targetCycles, currentCycle + 1);
}
