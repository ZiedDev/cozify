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
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-blue-400 bg-blue-500/10 border-blue-500/25">
                  <Clock className="size-3.5" />
                </div>
                <Typography
                  className="text-foreground"
                  type="body-xs"
                  weight="semibold"
                >
                  Focus Time
                </Typography>
              </div>
              <Typography
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-separator/30"
                color="muted"
                type="body-xs"
                weight="medium"
              >
                {stats.totalSessions}{" "}
                {stats.totalSessions === 1 ? "session" : "sessions"}
              </Typography>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <Typography
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
                type="h2"
                weight="bold"
              >
                {formatMinutesDisplay(stats.totalFocusMinutes)}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-separator/20 text-center">
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography className="text-[9px]" color="muted" type="body-xs">
                Avg Session
              </Typography>
              <Typography
                className="text-[11px] text-foreground tabular-nums"
                type="body-xs"
                weight="semibold"
              >
                {stats.avgSessionMinutes}m
              </Typography>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography className="text-[9px]" color="muted" type="body-xs">
                Longest
              </Typography>
              <Typography
                className="text-[11px] text-foreground tabular-nums"
                type="body-xs"
                weight="semibold"
              >
                {stats.longestSessionMinutes}m
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_pomodoros":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-purple-400 bg-purple-500/10 border-purple-500/25">
                  <Target className="size-3.5" />
                </div>
                <Typography
                  className="text-foreground"
                  type="body-xs"
                  weight="semibold"
                >
                  Pomodoro Cycles
                </Typography>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
                {stats.cycleCompletionRate}% Goal
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <Typography
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
                type="h2"
                weight="bold"
              >
                {stats.totalCycles}
              </Typography>
              <Typography
                className="text-xs font-normal"
                color="muted"
                type="body-xs"
              >
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
                <ProgressBar.Fill className="bg-purple-500 rounded-full transition-[width] duration-300 shadow-2xs" />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex items-center justify-between text-[10px]">
              <Typography className="text-[10px]" color="muted" type="body-xs">
                Target Completion
              </Typography>
              <Typography
                className="text-[10px] text-foreground"
                type="body-xs"
                weight="medium"
              >
                {stats.cycleCompletionRate}%
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_streaks":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-amber-400 bg-amber-500/10 border-amber-500/25">
                  <Flame className="size-3.5" />
                </div>
                <Typography
                  className="text-foreground"
                  type="body-xs"
                  weight="semibold"
                >
                  Consistency Streak
                </Typography>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                {stats.totalActiveDays} Active Days
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-1">
              <Typography
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
                type="h2"
                weight="bold"
              >
                {stats.currentStreakDays}
              </Typography>
              <Typography
                className="text-xs font-normal"
                color="muted"
                type="body-xs"
              >
                {stats.currentStreakDays === 1 ? "day streak" : "days streak"}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-separator/20 text-center">
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography className="text-[9px]" color="muted" type="body-xs">
                Best Streak
              </Typography>
              <Typography
                className="text-[11px] text-amber-400 tabular-nums"
                type="body-xs"
                weight="semibold"
              >
                {stats.bestStreakDays}d
              </Typography>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-surface-secondary/60">
              <Typography className="text-[9px]" color="muted" type="body-xs">
                Total Days
              </Typography>
              <Typography
                className="text-[11px] text-foreground tabular-nums"
                type="body-xs"
                weight="semibold"
              >
                {stats.totalActiveDays}d
              </Typography>
            </div>
          </div>
        </div>
      );

    case "kpi_tasks":
      return (
        <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors duration-200 select-none h-full">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-xl border flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <Typography
                  className="text-foreground"
                  type="body-xs"
                  weight="semibold"
                >
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
                className="text-xl sm:text-2xl font-serif text-foreground tracking-tight tabular-nums"
                type="h2"
                weight="bold"
              >
                {stats.tasksCompleted}
              </Typography>
              <Typography
                className="text-xs font-normal"
                color="muted"
                type="body-xs"
              >
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
                <ProgressBar.Fill className="bg-emerald-500 rounded-full transition-[width] duration-300 shadow-2xs" />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex items-center justify-between text-[10px]">
              <Typography className="text-[10px]" color="muted" type="body-xs">
                Completion Rate
              </Typography>
              <Typography
                className="text-[10px] text-foreground"
                type="body-xs"
                weight="medium"
              >
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
