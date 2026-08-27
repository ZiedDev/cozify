import { Clock, Target, Flame, CheckCircle2 } from "lucide-react";
import { ProgressBar, Typography } from "@heroui/react";

import { OverallStats } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

interface StatsKpiCardProps {
  type: "kpi_focus_time" | "kpi_pomodoros" | "kpi_streaks" | "kpi_tasks";
  stats: OverallStats;
}

export function StatsKpiCard({ type, stats }: StatsKpiCardProps) {
  switch (type) {
    case "kpi_focus_time":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-blue-400 bg-blue-500/10 border-blue-500/25">
                  <Clock className="size-3.5" />
                </div>
                <Typography type="body-xs" weight="semibold" className="text-foreground">
                  Focus Time
                </Typography>
              </div>
              <Typography
                color="muted"
                type="body-xs"
                weight="medium"
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/30"
              >
                {stats.totalSessions}{" "}
                {stats.totalSessions === 1 ? "session" : "sessions"}
              </Typography>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <Typography
                type="h2"
                weight="bold"
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
              >
                {formatMinutesDisplay(stats.totalFocusMinutes)}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-separator/20 text-center">
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography color="muted" type="body-xs" className="text-[9px]">
                Avg Session
              </Typography>
              <Typography type="body-xs" weight="semibold" className="text-[11px] text-foreground tabular-nums">
                {stats.avgSessionMinutes}m
              </Typography>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography color="muted" type="body-xs" className="text-[9px]">
                Longest
              </Typography>
              <Typography type="body-xs" weight="semibold" className="text-[11px] text-foreground tabular-nums">
                {stats.longestSessionMinutes}m
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_pomodoros":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-purple-400 bg-purple-500/10 border-purple-500/25">
                  <Target className="size-3.5" />
                </div>
                <Typography type="body-xs" weight="semibold" className="text-foreground">
                  Pomodoro Cycles
                </Typography>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
                {stats.cycleCompletionRate}% Goal
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <Typography
                type="h2"
                weight="bold"
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
              >
                {stats.totalCycles}
              </Typography>
              <Typography color="muted" type="body-xs" className="text-xs font-normal">
                / {stats.targetCyclesTotal || stats.totalCycles} target
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-separator/20">
            <ProgressBar
              aria-label="Pomodoro target completion"
              value={stats.cycleCompletionRate}
            >
              <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                <ProgressBar.Fill className="bg-purple-500 rounded-full transition-all duration-300 shadow-2xs" />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex items-center justify-between text-[10px]">
              <Typography color="muted" type="body-xs" className="text-[10px]">
                Target Completion
              </Typography>
              <Typography type="body-xs" weight="medium" className="text-[10px] text-foreground">
                {stats.cycleCompletionRate}%
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_streaks":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-amber-400 bg-amber-500/10 border-amber-500/25">
                  <Flame className="size-3.5" />
                </div>
                <Typography type="body-xs" weight="semibold" className="text-foreground">
                  Consistency Streak
                </Typography>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                {stats.totalActiveDays} Active Days
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <Typography
                type="h2"
                weight="bold"
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
              >
                {stats.currentStreakDays}
              </Typography>
              <Typography color="muted" type="body-xs" className="text-xs font-normal">
                {stats.currentStreakDays === 1 ? "day streak" : "days streak"}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-separator/20 text-center">
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography color="muted" type="body-xs" className="text-[9px]">
                Best Streak
              </Typography>
              <Typography type="body-xs" weight="semibold" className="text-[11px] text-amber-400 tabular-nums">
                {stats.bestStreakDays}d
              </Typography>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography color="muted" type="body-xs" className="text-[9px]">
                Total Days
              </Typography>
              <Typography type="body-xs" weight="semibold" className="text-[11px] text-foreground tabular-nums">
                {stats.totalActiveDays}d
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_tasks":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <Typography type="body-xs" weight="semibold" className="text-foreground">
                  Tasks Finished
                </Typography>
              </div>
              {stats.tasksCompletedToday > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  +{stats.tasksCompletedToday} today
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <Typography
                type="h2"
                weight="bold"
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
              >
                {stats.tasksCompleted}
              </Typography>
              <Typography color="muted" type="body-xs" className="text-xs font-normal">
                / {stats.tasksTotal} total
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-separator/20">
            <ProgressBar
              aria-label="Task completion rate"
              value={stats.taskCompletionRate}
            >
              <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                <ProgressBar.Fill className="bg-emerald-500 rounded-full transition-all duration-300 shadow-2xs" />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex items-center justify-between text-[10px]">
              <Typography color="muted" type="body-xs" className="text-[10px]">
                Completion Rate
              </Typography>
              <Typography type="body-xs" weight="medium" className="text-[10px] text-foreground">
                {stats.taskCompletionRate}%
              </Typography>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
