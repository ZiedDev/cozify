import { LucideIcon } from "lucide-react";

export type TimeRangeFilter = "all" | "today" | "week" | "month" | "custom";

export interface CustomDateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface DayActivity {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon", "Tue", "W12", "Jan"
  fullDateLabel: string; // e.g. "Aug 26, 2026"
  focusMinutes: number;
  overtimeMinutes?: number;
  totalPeriodMinutes?: number; // total focus minutes when grouped by week/month
  cycleCount: number;
  sessionCount: number;
  taskCompletedCount: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  periodType?: "hourly" | "daily" | "weekly" | "monthly";
  dateRange?: { start: string; end: string };
  isFuture?: boolean;
}

export interface TimeOfDayStat {
  period: "morning" | "afternoon" | "evening" | "night";
  label: string;
  timeRange: string;
  minutes: number;
  sessionsCount: number;
  percentage: number;
  iconName: "sunrise" | "sun" | "sunset" | "moon";
}

export interface TagStat {
  id: string;
  label: string;
  color: string;
  focusMinutes: number;
  overtimeMinutes?: number;
  taskCount: number;
  completedTaskCount: number;
  percentage: number;
}

export interface PriorityStat {
  id: string;
  label: string;
  color: string;
  dotColor: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: "focus" | "consistency" | "tasks" | "mastery" | "secret";
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xp: number;
  icon: LucideIcon;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  badgeColor: string;
  borderHighlight: string;
  isSecret?: boolean;
  lockedTitle?: string;
  lockedDescription?: string;
  lockedIcon?: LucideIcon;
}

export interface OverallStats {
  totalFocusMinutes: number;
  totalSessions: number;
  totalCycles: number;
  targetCyclesTotal: number;
  cycleCompletionRate: number;
  avgSessionMinutes: number;
  longestSessionMinutes: number;
  totalOvertimeMinutes: number;

  // Streaks
  currentStreakDays: number;
  bestStreakDays: number;
  totalActiveDays: number;

  // Tasks
  tasksTotal: number;
  tasksCompleted: number;
  taskCompletionRate: number;
  tasksCompletedToday: number;

  // Rhythm
  peakProductivePeriod: string;
}
