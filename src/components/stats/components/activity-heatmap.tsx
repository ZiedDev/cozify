import { Tooltip, Typography } from "@heroui/react";
import { Grid3X3, Flame, Award, Calendar } from "lucide-react";

import { DayActivity, OverallStats } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

interface ActivityHeatmapProps {
  heatmapData: {
    weeks: DayActivity[][];
    months: { label: string; weekIndex: number }[];
    rangeTitle?: string;
  };
  overallStats: OverallStats;
}

export function ActivityHeatmap({
  heatmapData,
  overallStats,
}: ActivityHeatmapProps) {
  const { weeks, months, rangeTitle } = heatmapData;

  const getCellClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 4:
        return "bg-accent border-accent text-accent-foreground shadow-2xs";
      case 3:
        return "bg-accent/75 border-accent/85";
      case 2:
        return "bg-accent/50 border-accent/60";
      case 1:
        return "bg-accent/25 border-accent/35";
      case 0:
      default:
        return "bg-surface-secondary border-separator/40 hover:border-separator/70";
    }
  };

  return (
    <div className="flex flex-col justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Grid3X3 className="size-3.5" />
          </div>
          <div>
            <Typography type="body-sm" weight="semibold" className="text-xs sm:text-sm text-foreground">
              Focus Momentum Matrix
            </Typography>
            <Typography color="muted" type="body-xs" className="text-[10px] font-light">
              {rangeTitle || "Consistency and focus frequency"}
            </Typography>
          </div>
        </div>

        {/* Quick streak pills */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            <Flame className="size-2.5" />
            <span>{overallStats.currentStreakDays}d streak</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium hidden sm:flex">
            <Award className="size-2.5" />
            <span>{overallStats.totalActiveDays} active days</span>
          </span>
        </div>
      </div>

      {/* Heatmap Grid with Horizontal Scroll */}
      <div className="w-full overflow-x-auto pb-0.5 pt-1 select-none scrollbar-thin">
        <div className="min-w-fit flex flex-col gap-0.5 px-0.5">
          {/* Month Labels Header */}
          <div className="flex text-[9px] text-muted/75 font-medium pl-5 mb-0.5">
            {weeks.map((_, idx) => {
              const matchMonth = months.find((m) => m.weekIndex === idx);

              return (
                <div key={idx} className="w-3 sm:w-3.5 shrink-0 text-left">
                  {matchMonth ? matchMonth.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid Rows (7 rows, one for each day of the week) */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-0.5">
              {/* Day Name Label (Mon, Wed, Fri) */}
              <span className="w-4.5 text-[8px] text-muted/60 text-right pr-0.5 font-medium">
                {dayIndex === 1
                  ? "Mon"
                  : dayIndex === 3
                    ? "Wed"
                    : dayIndex === 5
                      ? "Fri"
                      : ""}
              </span>

              {/* Day Cells across weeks */}
              <div className="flex items-center gap-0.5">
                {weeks.map((week, weekIdx) => {
                  const day = week[dayIndex];

                  if (!day)
                    return <div key={weekIdx} className="size-2.5 sm:size-3" />;

                  return (
                    <Tooltip key={day.dateStr} delay={50}>
                      <Tooltip.Trigger>
                        <div
                          aria-label={`${day.fullDateLabel}: ${day.focusMinutes} mins`}
                          className={`size-2.5 sm:size-3 rounded-[2px] border transition-colors duration-150 cursor-pointer hover:border-foreground/80 shrink-0 ${getCellClass(
                            day.intensityLevel,
                          )}`}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Content className="text-xs p-2 rounded-xl bg-surface border border-separator shadow-2xl z-50 pointer-events-none">
                        <div className="flex flex-col gap-1 min-w-28">
                          <div className="flex items-center gap-1.5 border-b border-separator/40 pb-1 text-muted text-[10px]">
                            <Calendar className="size-2.5 text-accent" />
                            <span>{day.fullDateLabel}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground pt-0.5">
                            <span>Focus:</span>
                            <span className="text-accent">
                              {formatMinutesDisplay(day.focusMinutes)}
                            </span>
                          </div>
                          {day.cycleCount > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>Pomodoros:</span>
                              <span className="font-medium text-foreground">
                                {day.cycleCount}{" "}
                                {day.cycleCount === 1 ? "cycle" : "cycles"}
                              </span>
                            </div>
                          )}
                          {day.taskCompletedCount > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-emerald-400">
                              <span>Tasks Done:</span>
                              <span className="font-medium">
                                {day.taskCompletedCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </Tooltip.Content>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend and Intensity Indicators */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-separator/20 text-[9px] text-muted flex-wrap">
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="flex items-center gap-0.5">
            <span className="size-2 rounded-[1px] bg-surface-secondary border border-separator/40" />
            <span className="size-2 rounded-[1px] bg-accent/25 border border-accent/35" />
            <span className="size-2 rounded-[1px] bg-accent/50 border border-accent/60" />
            <span className="size-2 rounded-[1px] bg-accent/75 border border-accent/85" />
            <span className="size-2 rounded-[1px] bg-accent border border-accent" />
          </div>
          <span>More</span>
        </div>

        <div className="flex items-center gap-2.5 text-muted/80 text-[10px]">
          <span>
            Streak:{" "}
            <strong className="text-foreground font-semibold">
              {overallStats.bestStreakDays}d
            </strong>
          </span>
          <span>
            Total Cycles:{" "}
            <strong className="text-foreground font-semibold">
              {overallStats.totalCycles}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
