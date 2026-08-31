import { useState, useMemo } from "react";
import {
  Modal,
  ProgressBar,
  ScrollShadow,
  Tabs,
  Typography,
} from "@heroui/react";
import {
  Trophy,
  CheckCircle2,
  CircleCheck,
  Lock,
  LockOpen,
  HelpCircle,
  Shield,
} from "lucide-react";

import { Milestone } from "../types";
import { ACHIEVEMENT_CATEGORY_TABS, getRankFromXp } from "../achievements";
import { TIER_CONFIG } from "../achievements/types";

const FILTER_TABS = [
  { id: "all", label: "All", icon: CircleCheck },
  { id: "unlocked", label: "Unlocked", icon: LockOpen },
  { id: "locked", label: "Locked", icon: Lock },
] as const;

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: Milestone[];
}

function formatUnlockDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);

  return isNaN(d.getTime())
    ? dateStr
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export function AchievementsModal({
  isOpen,
  onClose,
  milestones,
}: AchievementsModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"all" | "unlocked" | "locked">(
    "all",
  );

  const unlockedCount = useMemo(
    () => milestones.filter((m) => m.unlocked).length,
    [milestones],
  );
  const totalCount = milestones.length;
  const completionPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const totalXp = useMemo(
    () =>
      milestones
        .filter((m) => m.unlocked)
        .reduce((sum, m) => sum + (m.xp || 50), 0),
    [milestones],
  );

  const maxXp = useMemo(
    () => milestones.reduce((sum, m) => sum + (m.xp || 50), 0),
    [milestones],
  );

  // Compute rank title based on total XP
  const rank = useMemo(() => getRankFromXp(totalXp), [totalXp]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory) {
        return false;
      }
      if (filterMode === "unlocked" && !m.unlocked) return false;
      if (filterMode === "locked" && m.unlocked) return false;

      return true;
    });
  }, [milestones, activeCategory, filterMode]);

  if (!isOpen) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog
          aria-label="Achievements & Trophies"
          className="max-sm:mt-0! sm:max-w-3xl w-full h-[85vh] sm:h-145 max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-2xl bg-surface border border-separator/60 shadow-2xl"
        >
          <Modal.CloseTrigger />

          {/* Clean Solid Hero Header Banner */}
          <div className="p-5 sm:p-6 bg-surface-secondary border-b border-separator/40 shrink-0">
            <div className="flex flex-col gap-3.5">
              {/* Top Row: Trophy Icon, Title & Rank Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 sm:size-14 rounded-2xl bg-surface flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                    <Trophy className="size-6 sm:size-7" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Modal.Heading className="text-lg sm:text-xl font-serif font-semibold tracking-tight text-foreground">
                        Achievements & Trophies
                      </Modal.Heading>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${rank.color}`}
                      >
                        Level {rank.level} • {rank.title}
                      </span>
                      <Typography
                        className="text-xs tabular-nums"
                        color="muted"
                        type="body-xs"
                        weight="medium"
                      >
                        {totalXp} / {maxXp} XP
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar with Shiny Accent */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Journey Progress</span>
                  <span className="font-semibold text-accent tabular-nums">
                    {completionPercent}% Mastered ({unlockedCount}/{totalCount})
                  </span>
                </div>
                <ProgressBar
                  aria-label="Overall achievement progress"
                  value={completionPercent}
                >
                  <ProgressBar.Track className="h-2 bg-surface rounded-full overflow-hidden border border-separator/40 shadow-inner">
                    <ProgressBar.Fill className="bg-accent rounded-full transition-[width] duration-300 shadow-xs" />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            </div>
          </div>

          {/* Navigation Controls: Categories & Status Filter */}
          <div className="flex items-center justify-between gap-2 p-3 sm:px-5 border-b border-separator/30 bg-surface shrink-0 flex-wrap">
            {/* Category Tabs */}
            <Tabs
              selectedKey={activeCategory}
              onSelectionChange={(k) => setActiveCategory(k as string)}
            >
              <Tabs.List
                aria-label="Achievement Categories"
                className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs"
              >
                {ACHIEVEMENT_CATEGORY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeCategory === tab.id;

                  return (
                    <Tabs.Tab
                      key={tab.id}
                      className="h-6.5 sm:h-7 px-1.5 sm:px-2.5 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1 sm:gap-1.5 transition-colors"
                      id={tab.id}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span
                        className={isSelected ? "inline" : "hidden sm:inline"}
                      >
                        {tab.label}
                      </span>
                      <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Tabs>

            {/* Quick Status Filter Tabs */}
            <Tabs
              selectedKey={filterMode}
              onSelectionChange={(k) =>
                setFilterMode(k as "all" | "unlocked" | "locked")
              }
            >
              <Tabs.List
                aria-label="Filter status"
                className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs"
              >
                {FILTER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = filterMode === tab.id;

                  return (
                    <Tabs.Tab
                      key={tab.id}
                      className="h-6.5 sm:h-7 px-1.5 sm:px-2.5 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1 sm:gap-1.5 transition-colors"
                      id={tab.id}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span
                        className={isSelected ? "inline" : "hidden sm:inline"}
                      >
                        {tab.label}
                      </span>
                      <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Tabs>
          </div>

          {/* Scrollable Achievements Grid with ScrollShadow */}
          <Modal.Body className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
            <ScrollShadow
              className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-5"
              orientation="vertical"
              size={24}
            >
              {filteredMilestones.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center text-muted">
                  <Shield className="size-8 text-muted/40 mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No achievements in this view
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Try switching the category tab or status filter above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {filteredMilestones.map((milestone) => {
                    const isSecretLocked = Boolean(
                      milestone.isSecret && !milestone.unlocked,
                    );
                    const displayTitle = isSecretLocked
                      ? milestone.lockedTitle || "Secret Achievement"
                      : milestone.title;
                    const displayDescription = isSecretLocked
                      ? milestone.lockedDescription ||
                        "A mysterious secret lies hidden here. Complete the unknown feat to uncover it."
                      : milestone.description;
                    const DisplayIcon = isSecretLocked
                      ? milestone.lockedIcon || HelpCircle
                      : milestone.icon;

                    const percent =
                      milestone.maxProgress > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (milestone.progress / milestone.maxProgress) *
                                100,
                            ),
                          )
                        : 0;

                    const tierConfig =
                      TIER_CONFIG[milestone.tier] || TIER_CONFIG.bronze;

                    return (
                      <div
                        key={milestone.id}
                        className={`relative flex flex-col justify-between p-3.5 rounded-2xl transition-[background-color,border-color,opacity] duration-200 ${
                          milestone.unlocked
                            ? `bg-surface border-2 ${tierConfig.borderHighlight}`
                            : isSecretLocked
                              ? "bg-surface-secondary/25 border border-dashed border-separator/40 opacity-70"
                              : "bg-surface-secondary/40 border border-separator/30 opacity-75"
                        }`}
                      >
                        {/* Card Top: Icon, Title, Tier & XP */}
                        <div className="flex items-start justify-between gap-2.5 mb-2 relative z-10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <DisplayIcon
                              className={`size-5 sm:size-5.5 shrink-0 transition-colors ${
                                milestone.unlocked
                                  ? tierConfig.iconColor
                                  : isSecretLocked
                                    ? "text-muted/60"
                                    : "text-muted/40"
                              }`}
                            />

                            <div className="flex flex-col min-w-0">
                              <Typography
                                truncate
                                className="text-xs sm:text-sm text-foreground"
                                type="body-sm"
                                weight="bold"
                              >
                                {displayTitle}
                              </Typography>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md border ${tierConfig.badgeClass}`}
                                >
                                  {tierConfig.label}
                                </span>
                                <Typography
                                  className="text-[10px] capitalize"
                                  color="muted"
                                  type="body-xs"
                                >
                                  • {milestone.category}
                                </Typography>
                              </div>
                            </div>
                          </div>

                          {/* XP Badge & Status */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/40 text-accent shadow-2xs">
                              +{milestone.xp || 50} XP
                            </span>
                            {milestone.unlocked ? (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                                <CheckCircle2 className="size-3" />
                                <span>Unlocked</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-muted/70">
                                <Lock className="size-3" />
                                <span>
                                  {isSecretLocked ? "Hidden" : "Locked"}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <Typography
                          className="text-xs font-normal leading-relaxed mb-3 relative z-10"
                          color="muted"
                          type="body-xs"
                        >
                          {displayDescription}
                        </Typography>

                        {/* Progress Bar (If in progress or locked) */}
                        <div className="flex flex-col gap-1 pt-2 border-t border-separator/30 mt-auto relative z-10">
                          <div className="flex items-center justify-between text-[10px]">
                            <Typography
                              className="text-[10px]"
                              color="muted"
                              type="body-xs"
                            >
                              {milestone.unlocked
                                ? milestone.unlockedAt
                                  ? `Unlocked ${formatUnlockDate(milestone.unlockedAt)}`
                                  : "Mastered"
                                : "Progress"}
                            </Typography>
                            <Typography
                              className="text-[10px] text-foreground tabular-nums"
                              type="body-xs"
                              weight="medium"
                            >
                              {milestone.unlocked
                                ? `${milestone.maxProgress} / ${milestone.maxProgress}`
                                : `${milestone.progress} / ${milestone.maxProgress}`}
                            </Typography>
                          </div>
                          <ProgressBar
                            aria-label={`${milestone.title} progress`}
                            value={percent}
                          >
                            <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                              <ProgressBar.Fill
                                className={`rounded-full transition-[width,background-color] duration-300 ${
                                  milestone.unlocked
                                    ? tierConfig.progressFill
                                    : "bg-accent/60"
                                }`}
                              />
                            </ProgressBar.Track>
                          </ProgressBar>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollShadow>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
