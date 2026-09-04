export type TimerMode = "focus" | "shortBreak" | "longBreak";

export type TimerDurations = {
  focus: number; // in seconds
  shortBreak: number; // in seconds
  longBreak: number; // in seconds
};

export const DEFAULT_TIMER_DURATIONS: TimerDurations = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const MAX_DURATION_MINUTES = 180;
export const MAX_DURATION_SECONDS = MAX_DURATION_MINUTES * 60;

export const DEFAULT_TARGET_CYCLES = 4;
export const MIN_TARGET_CYCLES = 1;
export const MAX_TARGET_CYCLES = 16;

export const TIMER_MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

export const TIMER_MODES: { id: TimerMode; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "shortBreak", label: "Short Break" },
  { id: "longBreak", label: "Long Break" },
];
