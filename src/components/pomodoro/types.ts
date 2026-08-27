import { TimerMode, TimerDurations } from "@/config/timer";

export type { TimerMode, TimerDurations };

export interface CycleState {
  timeLeft: number;
  isCompleted: boolean;
  initialDuration?: number;
}

export interface PersistedTimerState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  targetEndTime: number | null;
  currentCycle: number;
  completedCycles: number;
  targetCycles: number;
  durations: TimerDurations;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
  cycleStates?: Record<number, CycleState>;
}

export interface ConfirmationState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "secondary" | "danger" | "danger-soft";
  status?: "default" | "warning" | "danger" | "success" | "accent";
  onConfirm: () => void;
}

export interface TimerContextValue {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  isOvertime: boolean;
  isCycleActive: boolean;
  reachedCycles: number;
  currentCycle: number;
  completedCycles: number;
  targetCycles: number;
  durations: TimerDurations;
  cycleStates: Record<number, CycleState>;
  hasActiveSession: boolean;
  formattedTime: string;
  accumulatedFocusSeconds: number;
  accumulatedOvertimeSeconds: number;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  start: () => void;
  pause: () => void;
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
