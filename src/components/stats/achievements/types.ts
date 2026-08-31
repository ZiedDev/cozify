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

export type AchievementTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export interface TierStyleConfig {
  label: string;
  iconColor: string;
  badgeClass: string;
  borderHighlight: string;
  progressFill: string;
  glowColor: string;
}

export const TIER_CONFIG: Record<AchievementTier, TierStyleConfig> = {
  bronze: {
    label: "Bronze",
    iconColor: "text-amber-600 dark:text-amber-500",
    badgeClass:
      "text-amber-600 dark:text-amber-400 bg-amber-600/10 border-amber-600/30",
    borderHighlight:
      "border-amber-600/60 shadow-[0_0_12px_rgba(217,119,6,0.15)]",
    progressFill: "bg-amber-600 dark:bg-amber-500",
    glowColor: "rgba(217, 119, 6, 0.2)",
  },
  silver: {
    label: "Silver",
    iconColor: "text-slate-400 dark:text-slate-300",
    badgeClass:
      "text-slate-400 dark:text-slate-200 bg-slate-400/10 border-slate-400/30",
    borderHighlight:
      "border-slate-400/70 shadow-[0_0_12px_rgba(148,163,184,0.2)]",
    progressFill: "bg-slate-400 dark:bg-slate-300",
    glowColor: "rgba(148, 163, 184, 0.2)",
  },
  gold: {
    label: "Gold",
    iconColor: "text-yellow-500 dark:text-yellow-400",
    badgeClass:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/35",
    borderHighlight:
      "border-yellow-400/80 shadow-[0_0_16px_rgba(250,204,21,0.25)]",
    progressFill: "bg-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.25)",
  },
  platinum: {
    label: "Platinum",
    iconColor: "text-cyan-400 dark:text-cyan-300",
    badgeClass:
      "text-cyan-500 dark:text-cyan-300 bg-cyan-400/10 border-cyan-400/35",
    borderHighlight:
      "border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.3)]",
    progressFill: "bg-cyan-400",
    glowColor: "rgba(34, 211, 238, 0.3)",
  },
  diamond: {
    label: "Diamond",
    iconColor: "text-fuchsia-400 dark:text-purple-400",
    badgeClass:
      "text-fuchsia-500 dark:text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/40",
    borderHighlight:
      "border-fuchsia-400/90 shadow-[0_0_20px_rgba(217,70,239,0.35)]",
    progressFill: "bg-gradient-to-r from-fuchsia-500 to-purple-500",
    glowColor: "rgba(217, 70, 239, 0.35)",
  },
};

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: "focus" | "consistency" | "tasks" | "mastery" | "secret";
  tier: AchievementTier;
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
