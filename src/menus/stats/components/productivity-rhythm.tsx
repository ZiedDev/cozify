import { memo } from "react";
import { ProgressBar, Typography } from "@heroui/react";
import { Sunrise, Sun, Sunset, Moon, Clock, Zap } from "lucide-react";

import { TimeOfDayStat, OverallStats } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

function ProductivityRhythmComponent({
  timeOfDayStats,
  overallStats,
}: {
  timeOfDayStats: TimeOfDayStat[];
  overallStats: OverallStats;
}) {
  const getPeriodIcon = (iconName: string) => {
    switch (iconName) {
      case "sunrise":
        return Sunrise;
      case "sun":
        return Sun;
      case "sunset":
        return Sunset;
      case "moon":
      default:
        return Moon;
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full h-full flex flex-col justify-between select-none">
      <div>
        {/* Clean Header */}
        <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-separator/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-foreground text-xs sm:text-sm font-semibold">
              <Clock className="size-3.5 text-accent shrink-0" />
              <span>Productivity Rhythm</span>
            </div>
            <Typography
              className="text-xs font-light mt-0.5"
              color="muted"
              type="body-xs"
            >
              Focus distribution throughout the day
            </Typography>
          </div>

          {overallStats.peakProductivePeriod &&
            overallStats.peakProductivePeriod !== "Flexible" && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25 font-medium shrink-0">
                <Zap className="size-3" />
                <span>{overallStats.peakProductivePeriod.split(" ")[0]}</span>
              </span>
            )}
        </div>

        {/* Time of Day Progress Bars */}
        <div className="flex flex-col gap-2.5 pt-0.5">
          {timeOfDayStats.map((item) => {
            const Icon = getPeriodIcon(item.iconName);

            return (
              <div key={item.period} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5 text-muted" />
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted/70 hidden sm:inline">
                      ({item.timeRange})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs tabular-nums">
                    <span className="font-semibold text-foreground">
                      {formatMinutesDisplay(item.minutes)}
                    </span>
                    <span className="text-xs text-muted w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  aria-label={`${item.label} focus distribution`}
                  value={item.percentage}
                >
                  <ProgressBar.Track className="h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                    <ProgressBar.Fill className="bg-accent rounded-full transition-[width] duration-300 shadow-2xs" />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight */}
      <Typography
        className="text-xs opacity-75 font-light mt-3 pt-2 border-t border-separator/20"
        color="muted"
        type="body-xs"
      >
        Peak productivity:{" "}
        <strong className="text-foreground font-medium">
          {overallStats.peakProductivePeriod}
        </strong>
      </Typography>
    </div>
  );
}

export const ProductivityRhythm = memo(ProductivityRhythmComponent);
