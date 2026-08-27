import { useState } from "react";
import { ProgressBar, Tabs, Typography } from "@heroui/react";
import { Sunrise, Sun, Sunset, Moon, Tag, Clock, Zap } from "lucide-react";

import { TimeOfDayStat, TagStat, OverallStats } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

interface TimeAndTagsBreakdownProps {
  timeOfDayStats: TimeOfDayStat[];
  tagStats: TagStat[];
  overallStats: OverallStats;
}

export function TimeAndTagsBreakdown({
  timeOfDayStats,
  tagStats,
  overallStats,
}: TimeAndTagsBreakdownProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("rhythm");

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

  // Section 1: Productivity Rhythm
  const renderRhythmContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Clock className="size-3.5" />
            </div>
            <div>
              <Typography type="body-sm" weight="semibold" className="text-xs sm:text-sm text-foreground">
                Productivity Rhythm
              </Typography>
              <Typography color="muted" type="body-xs" className="text-[10px] font-light">
                Focus distribution throughout the day
              </Typography>
            </div>
          </div>

          {overallStats.peakProductivePeriod !== "Flexible" && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25 font-medium shrink-0">
              <Zap className="size-2.5" />
              <span>{overallStats.peakProductivePeriod.split(" ")[0]}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {timeOfDayStats.map((item) => {
            const Icon = getPeriodIcon(item.iconName);

            return (
              <div key={item.period} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3 text-muted" />
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted/70 hidden sm:inline">
                      ({item.timeRange})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                    <span className="font-semibold text-foreground">
                      {formatMinutesDisplay(item.minutes)}
                    </span>
                    <span className="text-[10px] text-muted w-7 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  aria-label={`${item.label} focus distribution`}
                  value={item.percentage}
                >
                  <ProgressBar.Track className="h-1 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                    <ProgressBar.Fill className="bg-accent rounded-full transition-all duration-300 shadow-2xs" />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            );
          })}
        </div>
      </div>

      <Typography color="muted" type="body-xs" className="text-[10px] opacity-70 font-light mt-2 pt-1.5 border-t border-separator/20">
        Peak productivity:{" "}
        <strong className="text-foreground font-medium">
          {overallStats.peakProductivePeriod}
        </strong>
      </Typography>
    </div>
  );

  // Section 2: Tags & Categories
  const renderCategoryContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Tag className="size-3.5" />
            </div>
            <div>
              <Typography type="body-sm" weight="semibold" className="text-xs sm:text-sm text-foreground">
                Tag Breakdown
              </Typography>
              <Typography color="muted" type="body-xs" className="text-[10px] font-light">
                Focus allocation across categories
              </Typography>
            </div>
          </div>
          <Typography color="muted" type="body-xs" weight="medium" className="text-[10px]">
            {tagStats.length} Tags
          </Typography>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {tagStats.length === 0 ? (
            <Typography color="muted" type="body-xs" className="py-4 text-center text-[11px]">
              No tagged focus sessions yet.
            </Typography>
          ) : (
            tagStats.slice(0, 4).map((tag) => (
              <div key={tag.id} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-foreground">
                      {tag.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                    <span className="font-semibold text-foreground">
                      {formatMinutesDisplay(tag.focusMinutes)}
                    </span>
                    <span className="text-[10px] text-muted w-7 text-right">
                      {tag.percentage}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  aria-label={`${tag.label} focus distribution`}
                  value={tag.percentage}
                >
                  <ProgressBar.Track className="h-1 bg-surface-secondary rounded-full overflow-hidden border border-separator/30">
                    <ProgressBar.Fill
                      className="rounded-full transition-all duration-300 shadow-2xs"
                      style={{ backgroundColor: tag.color }}
                    />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            ))
          )}
        </div>
      </div>

      <Typography color="muted" type="body-xs" className="text-[10px] opacity-70 font-light mt-2 pt-1.5 border-t border-separator/20">
        Categorize your sessions and tasks with tags.
      </Typography>
    </div>
  );

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-separator/30">
        <Tabs
          selectedKey={activeSubTab}
          onSelectionChange={(k) => setActiveSubTab(k as string)}
        >
          <Tabs.ListContainer className="rounded-full">
            <Tabs.List className="rounded-full bg-surface-secondary p-0.5 border border-separator/40 text-[10px] shadow-2xs">
              <Tabs.Tab
                className="h-5 px-2 rounded-full font-medium cursor-pointer flex items-center gap-1 text-[10px]"
                id="rhythm"
              >
                <Clock className="size-2.5" />
                <span>Rhythm</span>
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-2xs" />
              </Tabs.Tab>
              <Tabs.Tab
                className="h-5 px-2 rounded-full font-medium cursor-pointer flex items-center gap-1 text-[10px]"
                id="tags"
              >
                <Tag className="size-2.5" />
                <span>Tags</span>
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-2xs" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-between">
        {activeSubTab === "rhythm"
          ? renderRhythmContent()
          : renderCategoryContent()}
      </div>
    </div>
  );
}
