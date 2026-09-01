"use client";

import {
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastCloseButton,
  ToastQueue,
} from "@heroui/react";
import { Trophy, Star } from "lucide-react";

import { Milestone } from "@/components/stats/types";
import { TIER_CONFIG } from "@/components/stats/achievements/types";

export interface AchievementToastContentValue {
  milestone: Milestone;
}

export const achievementToastQueue =
  new ToastQueue<AchievementToastContentValue>();

export function showAchievementToast(milestone: Milestone) {
  return achievementToastQueue.add({ milestone }, { timeout: 10000 });
}

export function AchievementToastProvider() {
  return (
    <Toast.Provider
      className="z-9999 pointer-events-none"
      placement="top"
      queue={achievementToastQueue}
    >
      {({ toast: toastItem }) => {
        const milestone = toastItem.content.milestone;
        const Icon = milestone.icon;
        const tierConfig = TIER_CONFIG[milestone.tier] || TIER_CONFIG.bronze;

        return (
          <Toast
            className={`border-2 ${tierConfig.borderHighlight}`}
            toast={toastItem}
          >
            {/* Illuminated Icon Halo */}
            <div
              className={`size-11 sm:size-12 rounded-xl bg-surface-secondary/90 border border-separator/40 flex items-center justify-center shrink-0 shadow-inner relative ${tierConfig.iconColor}`}
            >
              <Icon className="size-6 sm:size-6.5" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center size-4.5 rounded-full bg-amber-400 text-black shadow-xs">
                <Star
                  className="size-2.5 animate-spin"
                  style={{ animationDuration: "8s" }}
                />
              </span>
            </div>

            {/* Toast Content */}
            <ToastContent className="flex flex-col min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <div className="flex items-center gap-1 text-amber-400">
                  <Trophy className="size-3 shrink-0" />
                  <span className="text-[10px] font-bold uppercase r">
                    Achievement Unlocked!
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md border ${tierConfig.badgeClass}`}
                >
                  {tierConfig.label}
                </span>
              </div>

              <ToastTitle className="text-sm font-bold tracking-tight text-foreground truncate">
                {milestone.title}
              </ToastTitle>

              <ToastDescription className="text-xs text-muted">
                {milestone.description}
              </ToastDescription>
            </ToastContent>

            {/* XP Reward Pill */}
            <div className="shrink-0 flex items-center pe-5">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-accent/15 border border-accent/35 text-accent shadow-xs whitespace-nowrap">
                +{milestone.xp || 50} XP
              </span>
            </div>

            <ToastCloseButton className="absolute inset-e-2 top-3 border-none bg-transparent opacity-70 hover:opacity-100 cursor-pointer [&>svg]:size-4" />
          </Toast>
        );
      }}
    </Toast.Provider>
  );
}
