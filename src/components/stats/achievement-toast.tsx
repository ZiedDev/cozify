"use client";

import { toast } from "@heroui/react";

import { Milestone } from "@/menus/stats/types";
import { TIER_CONFIG } from "@/menus/stats/achievements/types";

export function showAchievementToast(milestone: Milestone) {
  const Icon = milestone.icon;
  const tierConfig = TIER_CONFIG[milestone.tier] || TIER_CONFIG.bronze;

  return toast(
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          🏆 Achievement Unlocked!
        </span>
        <span
          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${tierConfig.badgeClass}`}
        >
          {tierConfig.label}
        </span>
      </div>
      <div className="text-sm font-bold text-foreground">{milestone.title}</div>
    </div>,
    {
      description: (
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted">{milestone.description}</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 shrink-0">
            +{milestone.xp || 50} XP
          </span>
        </div>
      ),
      indicator: (
        <div
          className={`size-9 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0 border border-separator/40 ${tierConfig.iconColor}`}
        >
          <Icon className="size-5" />
        </div>
      ),
      timeout: 8000,
    },
  );
}

// Global debug hook for quick manual verification
if (typeof window !== "undefined") {
  (window as any).__showAchievementToast = showAchievementToast;
}

export function AchievementToastProvider() {
  return null;
}
