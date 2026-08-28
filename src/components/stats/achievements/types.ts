import { LucideIcon } from "lucide-react";

export interface AchievementMetrics {
  totalSessions: number;
  totalCycles: number;
  totalFocusMinutes: number;
  longestSessionMinutes: number;
  currentStreakDays: number;
  totalActiveDays: number;
  morningSessionsCount: number;
  hasEarlyMorningSession: boolean;
  hasAfternoonSession: boolean;
  hasLateNightSession: boolean;
  hadSatAndSun: boolean;
  maxDailySessions: number;
  completedTodosCount: number;
  completedHighPriority: number;
  completedTagsCount: number;
  completedWithNotes: number;
  hasPerfectSession: boolean;
  hasOvertime5: boolean;
  hasOvertime15: boolean;
  totalOvertimeMins: number;
  isKonamiUnlocked: boolean;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: "focus" | "consistency" | "tasks" | "mastery" | "secret";
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xp: number;
  icon: LucideIcon;
  maxProgress: number;
  badgeColor: string;
  borderHighlight: string;
  isSecret?: boolean;
  lockedTitle?: string;
  lockedDescription?: string;
  lockedIcon?: LucideIcon;
  getValue: (m: AchievementMetrics) => number;
}
