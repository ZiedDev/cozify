import { useState, useMemo } from "react";
import { Modal, ProgressBar, Tabs, Typography } from "@heroui/react";
import {
  Trophy,
  CheckCircle2,
  Lock,
  Zap,
  Flame,
  Shield,
  Layers,
  Crown,
} from "lucide-react";

import { Milestone } from "../types";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: Milestone[];
}

const CATEGORY_TABS = [
  { id: "all", label: "All", icon: Trophy },
  { id: "focus", label: "Focus", icon: Zap },
  { id: "consistency", label: "Streaks", icon: Flame },
  { id: "tasks", label: "Tasks", icon: Layers },
  { id: "mastery", label: "Mastery", icon: Crown },
] as const;

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
  const rank = useMemo(() => {
    if (totalXp >= 6000)
      return {
        title: "Zen Grandmaster",
        level: 6,
        color: "text-amber-400 border-amber-500/40 bg-amber-500/15",
      };
    if (totalXp >= 4000)
      return {
        title: "Deep Flow Knight",
        level: 5,
        color: "text-purple-400 border-purple-500/40 bg-purple-500/15",
      };
    if (totalXp >= 2500)
      return {
        title: "Focus Champion",
        level: 4,
        color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/15",
      };
    if (totalXp >= 1200)
      return {
        title: "Habit Builder",
        level: 3,
        color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/15",
      };
    if (totalXp >= 400)
      return {
        title: "Flow Apprentice",
        level: 2,
        color: "text-blue-400 border-blue-500/40 bg-blue-500/15",
      };

    return {
      title: "Focus Explorer",
      level: 1,
      color: "text-muted border-separator bg-surface-secondary",
    };
  }, [totalXp]);

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

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-2xl max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-2xl bg-surface border border-separator/60 shadow-2xl">
          <Modal.CloseTrigger />

          {/* Clean Solid Hero Header Banner */}
          <div className="p-5 sm:p-6 bg-surface-secondary border-b border-separator/40 shrink-0">
            <div className="flex flex-col gap-3.5">
              {/* Top Row: Trophy Icon, Title & Rank Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 sm:size-14 rounded-2xl bg-surface border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xs shrink-0 relative">
                    <Trophy className="size-6 sm:size-7" />
                    <span className="absolute -bottom-1 -right-1 flex items-center justify-center size-5 rounded-full bg-surface border border-separator text-[10px] font-bold text-foreground shadow-2xs">
                      {rank.level}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Typography
                        className="text-lg sm:text-xl font-serif font-semibold tracking-tight text-foreground"
                        type="h3"
                      >
                        Achievements & Trophies
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
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

                {/* Unlocked Count Badge */}
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <Typography className="text-xs" color="muted" type="body-xs">
                    Completed
                  </Typography>
                  <Typography
                    className="text-lg font-serif text-foreground tabular-nums"
                    type="h3"
                    weight="bold"
                  >
                    {unlockedCount}{" "}
                    <Typography
                      className="text-xs inline font-normal"
                      color="muted"
                      type="body-xs"
                    >
                      / {totalCount}
                    </Typography>
                  </Typography>
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
                    <ProgressBar.Fill className="bg-accent rounded-full transition-all duration-300 shadow-xs" />
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
              <Tabs.ListContainer className="rounded-full">
                <Tabs.List
                  aria-label="Achievement Categories"
                  className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs"
                >
                  {CATEGORY_TABS.map((tab) => {
                    const Icon = tab.icon;

                    return (
                      <Tabs.Tab
                        key={tab.id}
                        className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                        id={tab.id}
                      >
                        <Icon className="size-3.5" />
                        <span>{tab.label}</span>
                        <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                      </Tabs.Tab>
                    );
                  })}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>

            {/* Quick Status Filter Tabs */}
            <Tabs
              selectedKey={filterMode}
              onSelectionChange={(k) =>
                setFilterMode(k as "all" | "unlocked" | "locked")
              }
            >
              <Tabs.ListContainer className="rounded-full">
                <Tabs.List
                  aria-label="Filter status"
                  className="rounded-full bg-surface-secondary/70 p-0.5 border border-separator/40 text-xs"
                >
                  <Tabs.Tab
                    className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer transition-all"
                    id="all"
                  >
                    All
                    <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                  </Tabs.Tab>
                  <Tabs.Tab
                    className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer transition-all"
                    id="unlocked"
                  >
                    Unlocked
                    <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                  </Tabs.Tab>
                  <Tabs.Tab
                    className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer transition-all"
                    id="locked"
                  >
                    Locked
                    <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>

          {/* Scrollable Achievements Grid */}
          <Modal.Body className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[58vh]">
            {filteredMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
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
                {filteredMilestones.map((m) => {
                  const Icon = m.icon;
                  const percent =
                    m.maxProgress > 0
                      ? Math.min(
                          100,
                          Math.round((m.progress / m.maxProgress) * 100),
                        )
                      : 0;

                  return (
                    <div
                      key={m.id}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl transition-all duration-200 ${
                        m.unlocked
                          ? `bg-surface border-2 ${m.borderHighlight}`
                          : "bg-surface-secondary/40 border border-separator/30 opacity-75"
                      }`}
                    >
                      {/* Card Top: Icon, Title, Tier & XP */}
                      <div className="flex items-start justify-between gap-2.5 mb-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`size-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                              m.unlocked
                                ? m.badgeColor
                                : "bg-surface text-muted/50 border-separator/40"
                            }`}
                          >
                            <Icon className="size-4.5" />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <Typography
                              truncate
                              className="text-xs sm:text-sm text-foreground"
                              type="body-sm"
                              weight="bold"
                            >
                              {m.title}
                            </Typography>
                            <Typography
                              className="text-[10px] capitalize"
                              color="muted"
                              type="body-xs"
                              weight="medium"
                            >
                              {m.tier} • {m.category}
                            </Typography>
                          </div>
                        </div>

                        {/* XP Badge & Status */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/40 text-accent shadow-2xs">
                            +{m.xp || 50} XP
                          </span>
                          {m.unlocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              <span>Unlocked</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted/70">
                              <Lock className="size-3" />
                              <span>Locked</span>
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
                        {m.description}
                      </Typography>

                      {/* Progress Bar (If in progress or locked) */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-separator/30 mt-auto relative z-10">
                        <div className="flex items-center justify-between text-[10px]">
                          <Typography
                            className="text-[10px]"
                            color="muted"
                            type="body-xs"
                          >
                            {m.unlocked ? "Mastered" : "Progress"}
                          </Typography>
                          <Typography
                            className="text-[10px] text-foreground tabular-nums"
                            type="body-xs"
                            weight="medium"
                          >
                            {m.unlocked
                              ? `${m.maxProgress} / ${m.maxProgress}`
                              : `${m.progress} / ${m.maxProgress}`}
                          </Typography>
                        </div>
                        <ProgressBar
                          aria-label={`${m.title} progress`}
                          value={percent}
                        >
                          <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                            <ProgressBar.Fill
                              className={`rounded-full transition-all duration-300 ${
                                m.unlocked ? "bg-accent" : "bg-accent/60"
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
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
