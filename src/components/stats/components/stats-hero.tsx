import { Clock, Flame, Target, CheckCircle2, Zap } from "lucide-react";
import { Typography } from "@heroui/react";

import { OverallStats, TimeRangeFilter, CustomDateRange } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

interface StatsHeroProps {
  stats: OverallStats;
  range: TimeRangeFilter;
  customDateRange: CustomDateRange | null;
}

const formatToDDMMYY = (dateStr: string) => {
  const parts = dateStr.split("-");

  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(-2);
  const mm = m.padStart(2, "0");
  const dd = d.padStart(2, "0");

  return `${dd}/${mm}/${yy}`;
};

export function StatsHero({ stats, range, customDateRange }: StatsHeroProps) {
  const getRangeLabel = () => {
    if (customDateRange) {
      return customDateRange.start === customDateRange.end
        ? formatToDDMMYY(customDateRange.start)
        : `${formatToDDMMYY(customDateRange.start)} - ${formatToDDMMYY(customDateRange.end)}`;
    }
    switch (range) {
      case "today":
        return "Today's Focus";
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "all":
      default:
        return "All-Time Overview";
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full select-none">
      {/* Top Row: Hero Focus Metric & Context */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <Clock className="size-3.5 text-accent" />
            <span>{getRangeLabel()}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <Typography
              className="text-2xl sm:text-3xl font-serif tracking-tight text-foreground tabular-nums"
              type="h1"
              weight="bold"
            >
              {formatMinutesDisplay(stats.totalFocusMinutes)}
            </Typography>
            {stats.totalActiveDays > 0 && stats.totalFocusMinutes > 0 && (
              <span className="text-xs text-muted font-normal">
                (avg{" "}
                <strong className="text-foreground font-semibold">
                  {formatMinutesDisplay(
                    Math.round(
                      stats.totalFocusMinutes /
                        Math.max(1, stats.totalActiveDays),
                    ),
                  )}
                </strong>
                /day)
              </span>
            )}
          </div>
        </div>

        {/* Peak Rhythm Badge */}
        {stats.peakProductivePeriod &&
          stats.peakProductivePeriod !== "Flexible" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold">
              <Zap className="size-3" />
              <span>Peak: {stats.peakProductivePeriod}</span>
            </div>
          )}
      </div>

      {/* Bottom Row: 4 Unified Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-2 border-t border-separator/30">
        {/* 1. Streak */}
        <div className="flex flex-col p-2.5 rounded-xl bg-surface-secondary/60 border border-separator/20">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Flame className="size-3.5" />
            <Typography
              className="text-[11px] text-foreground"
              type="body-xs"
              weight="semibold"
            >
              Streak
            </Typography>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums">
              {stats.currentStreakDays}d
            </span>
            <span className="text-[10px] text-muted">
              (best {stats.bestStreakDays}d)
            </span>
          </div>
        </div>

        {/* 2. Pomodoro Cycles */}
        <div className="flex flex-col p-2.5 rounded-xl bg-surface-secondary/60 border border-separator/20">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1">
            <Target className="size-3.5" />
            <Typography
              className="text-[11px] text-foreground"
              type="body-xs"
              weight="semibold"
            >
              Pomodoros
            </Typography>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums">
              {stats.totalCycles}
            </span>
            <span className="text-[10px] text-muted">
              ({stats.cycleCompletionRate}% hit)
            </span>
          </div>
        </div>

        {/* 3. Tasks Completed */}
        <div className="flex flex-col p-2.5 rounded-xl bg-surface-secondary/60 border border-separator/20">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <CheckCircle2 className="size-3.5" />
            <Typography
              className="text-[11px] text-foreground"
              type="body-xs"
              weight="semibold"
            >
              Tasks Done
            </Typography>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums">
              {stats.tasksCompleted}
            </span>
            <span className="text-[10px] text-muted">
              /{stats.tasksTotal} ({stats.taskCompletionRate}%)
            </span>
          </div>
        </div>

        {/* 4. Total Sessions */}
        <div className="flex flex-col p-2.5 rounded-xl bg-surface-secondary/60 border border-separator/20">
          <div className="flex items-center gap-1.5 text-blue-400 mb-1">
            <Clock className="size-3.5" />
            <Typography
              className="text-[11px] text-foreground"
              type="body-xs"
              weight="semibold"
            >
              Sessions
            </Typography>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums">
              {stats.totalSessions}
            </span>
            <span className="text-[10px] text-muted">
              (~{stats.avgSessionMinutes}m avg)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
