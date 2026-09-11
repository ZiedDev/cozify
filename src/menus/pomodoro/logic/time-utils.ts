import { MAX_DURATION_SECONDS } from "@/config/timer";

/**
 * Formats seconds into MM:SS (or +MM:SS for overtime)
 */
export function formatTimerDisplay(timeLeft: number): string {
  const isOvertime = timeLeft < 0;
  const absTime = Math.abs(timeLeft);
  const minutes = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return isOvertime ? `+${timeString}` : timeString;
}

/**
 * Formats duration into human-readable format (e.g. "5 min" or "5m 30s")
 */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) return `${minutes} min`;

  return `${minutes}m ${seconds}s`;
}

/**
 * Breaks total seconds into hours, minutes, seconds
 */
export function secondsToHms(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

/**
 * Clamps duration within allowed limits
 */
export function clampDuration(seconds: number, minSeconds = 60): number {
  return Math.max(minSeconds, Math.min(MAX_DURATION_SECONDS, seconds));
}

/**
 * Calculates new remaining seconds when adding minutes
 */
export function calculateAddedTime(
  currentSeconds: number,
  minutesToAdd: number,
): number {
  return clampDuration(currentSeconds + minutesToAdd * 60);
}
