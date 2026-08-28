import { Crown, Layers, Trophy } from "lucide-react";

import { AchievementDefinition } from "./types";

export const MASTERY_ACHIEVEMENTS: AchievementDefinition[] = [
  // Pomodoro Target & Overtime Mastery
  {
    id: "flawless_target",
    title: "Target Achieved",
    description: "Hit your planned target sprint cycles in a focus session",
    category: "mastery",
    tier: "silver",
    xp: 150,
    icon: Layers,
    maxProgress: 1,
    badgeColor: "text-purple-400",
    borderHighlight:
      "border-purple-400 shadow-[0_0_14px_rgba(192,132,252,0.35)]",
    getValue: (m) => (m.hasPerfectSession ? 1 : 0),
  },
  {
    id: "overdrive_5",
    title: "Overdrive 5",
    description:
      "Continue working 5+ minutes into overtime after a session ends",
    category: "mastery",
    tier: "bronze",
    xp: 75,
    icon: Layers,
    maxProgress: 1,
    badgeColor: "text-purple-400",
    borderHighlight:
      "border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    getValue: (m) => (m.hasOvertime5 ? 1 : 0),
  },
  {
    id: "overdrive_15",
    title: "Overdrive 15",
    description: "Push deep into overtime with 15+ extra minutes of flow",
    category: "mastery",
    tier: "silver",
    xp: 175,
    icon: Layers,
    maxProgress: 1,
    badgeColor: "text-purple-400",
    borderHighlight:
      "border-purple-400 shadow-[0_0_14px_rgba(192,132,252,0.35)]",
    getValue: (m) => (m.hasOvertime15 ? 1 : 0),
  },
  {
    id: "overtime_total_60",
    title: "Overtime Master",
    description: "Accumulate 60 total minutes in post-session overtime",
    category: "mastery",
    tier: "gold",
    xp: 400,
    icon: Layers,
    maxProgress: 60,
    badgeColor: "text-purple-400",
    borderHighlight:
      "border-purple-400 shadow-[0_0_16px_rgba(192,132,252,0.4)]",
    getValue: (m) => m.totalOvertimeMins,
  },

  // Meta Trophy Hunter Achievements
  {
    id: "trophy_hunter_10",
    title: "Trophy Collector",
    description: "Unlock 10 achievements across your journey",
    category: "mastery",
    tier: "silver",
    xp: 300,
    icon: Trophy,
    maxProgress: 10,
    badgeColor: "text-amber-400",
    borderHighlight: "border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.3)]",
    getValue: () => 0, // Resolved in meta calculation pass
  },
  {
    id: "trophy_hunter_20",
    title: "Trophy Master",
    description: "Unlock 20 achievements across your journey",
    category: "mastery",
    tier: "gold",
    xp: 750,
    icon: Trophy,
    maxProgress: 20,
    badgeColor: "text-amber-400",
    borderHighlight: "border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
    getValue: () => 0, // Resolved in meta calculation pass
  },
  {
    id: "trophy_hunter_30",
    title: "Trophy Grandmaster",
    description: "Unlock 30 achievements across your journey",
    category: "mastery",
    tier: "platinum",
    xp: 1500,
    icon: Crown,
    maxProgress: 30,
    badgeColor: "text-amber-300",
    borderHighlight: "border-amber-400 shadow-[0_0_16px_rgba(252,211,77,0.35)]",
    getValue: () => 0, // Resolved in meta calculation pass
  },
  {
    id: "cozy_legend",
    title: "Cozify Deity",
    description: "Unlock 40 achievements across your journey",
    category: "mastery",
    tier: "diamond",
    xp: 3000,
    icon: Trophy,
    maxProgress: 40,
    badgeColor: "text-amber-300",
    borderHighlight: "border-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.45)]",
    getValue: () => 0, // Resolved in meta calculation pass
  },
];
