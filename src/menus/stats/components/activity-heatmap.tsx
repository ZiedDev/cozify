import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Tabs, Typography, Button } from "@heroui/react";
import { ArrowLeft, ArrowRight, Calendar, X } from "lucide-react";

import { DayActivity, OverallStats } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

interface ActivityHeatmapProps {
  heatmapData: {
    weeks: DayActivity[][];
    months: { label: string; weekIndex: number }[];
    rangeTitle?: string;
  };
  overallStats: OverallStats;
  onSelectDate?: (dateStr: string) => void;
}

type ViewMode = "6m" | "12m";

export function ActivityHeatmap({
  heatmapData,
  overallStats: _overallStats,
  onSelectDate,
}: ActivityHeatmapProps) {
  const { weeks } = heatmapData;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("6m");
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    day: DayActivity;
    x: number;
    y: number;
  } | null>(null);

  // 6M mode = 26 weeks per page (H1: Jan-Jun, H2: Jul-Dec)
  const total6mPages = Math.max(1, Math.ceil(weeks.length / 26));
  const [page6m, setPage6m] = useState<number>(total6mPages);

  // 12M mode = 52 weeks per page (Jan 1st - Dec 31st)
  const total12mPages = Math.max(1, Math.ceil(weeks.length / 52));
  const [page12m, setPage12m] = useState<number>(total12mPages);

  useEffect(() => {
    setPage6m(total6mPages);
  }, [total6mPages]);

  useEffect(() => {
    setPage12m(total12mPages);
  }, [total12mPages]);

  // Sliced weeks strictly starting at the beginning of the year / semester
  const visibleWeeks = useMemo(() => {
    if (viewMode === "6m") {
      const start = (page6m - 1) * 26;

      return weeks.slice(start, start + 26);
    }
    const start = (page12m - 1) * 52;

    return weeks.slice(start, start + 52);
  }, [weeks, viewMode, page6m, page12m]);

  // Auto-scroll to latest week whenever visible weeks or view mode change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [viewMode, visibleWeeks]);

  // Compute exact column placements for month labels
  const monthHeaders = useMemo(() => {
    const headers: { label: string; weekIndex: number }[] = [];
    let lastMonth = "";

    visibleWeeks.forEach((week, weekIdx) => {
      const firstOfMonth = week.find((day) => {
        if (!day) return false;
        const d = new Date(`${day.dateStr}T12:00:00`);

        return d.getDate() <= 7;
      });

      if (firstOfMonth) {
        const d = new Date(`${firstOfMonth.dateStr}T12:00:00`);
        const mLabel = d.toLocaleDateString("en-US", { month: "short" });

        if (mLabel !== lastMonth) {
          headers.push({ label: mLabel, weekIndex: weekIdx });
          lastMonth = mLabel;
        }
      }
    });

    return headers;
  }, [visibleWeeks]);

  const getContributionColor = (day: DayActivity, isSelected: boolean) => {
    if (day.isFuture) {
      const selectedRing = isSelected ? "ring-2 ring-muted scale-110 z-10" : "";

      return `${selectedRing} bg-surface-secondary/25 border-dashed border-separator/30 opacity-40 hover:opacity-80`;
    }

    const selectedRing = isSelected
      ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background scale-110 z-10"
      : "";

    switch (day.intensityLevel) {
      case 4:
        return `${selectedRing} bg-emerald-400 border-emerald-400 text-white`;
      case 3:
        return `${selectedRing} bg-emerald-500 border-emerald-500 text-white`;
      case 2:
        return `${selectedRing} bg-emerald-600/80 border-emerald-600 text-white`;
      case 1:
        return `${selectedRing} bg-emerald-800/60 dark:bg-emerald-900/60 border-emerald-800/50`;
      case 0:
      default:
        return `${selectedRing} bg-surface-secondary border-separator/40 hover:border-separator/90`;
    }
  };

  // Metrics for active window (excluding unreached future days)
  const visibleStats = useMemo(() => {
    let focusMinutes = 0;
    let activeDays = 0;
    let pastDays = 0;

    visibleWeeks.forEach((w) => {
      w.forEach((d) => {
        if (d && !d.isFuture) {
          pastDays++;
          focusMinutes += d.focusMinutes;
          if (d.focusMinutes > 0) activeDays++;
        }
      });
    });

    return {
      focusMinutes,
      activeDays,
      totalDays: Math.max(1, pastDays),
      consistency: Math.round((activeDays / Math.max(1, pastDays)) * 100),
    };
  }, [visibleWeeks]);

  // Title & Period label derived from current visible window
  const periodLabel = useMemo(() => {
    const firstDay = visibleWeeks[0]?.find(Boolean);
    const lastDay = visibleWeeks[visibleWeeks.length - 1]
      ?.filter(Boolean)
      .pop();

    if (!firstDay || !lastDay) return "Focus Calendar";

    const d1 = new Date(`${firstDay.dateStr}T12:00:00`);
    const d2 = new Date(`${lastDay.dateStr}T12:00:00`);

    if (viewMode === "12m") {
      return `${d2.getFullYear()}`;
    }

    return `${d1.toLocaleDateString("en-US", { month: "short" })} - ${d2.toLocaleDateString("en-US", { month: "short" })} ${d2.getFullYear()}`;
  }, [visibleWeeks, viewMode]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    const firstDay = visibleWeeks[0]?.find(Boolean);
    const lastDay = visibleWeeks[visibleWeeks.length - 1]
      ?.filter(Boolean)
      .pop();

    if (!firstDay || !lastDay) return "Focus Grid";

    const d1 = new Date(`${firstDay.dateStr}T12:00:00`);
    const d2 = new Date(`${lastDay.dateStr}T12:00:00`);

    return `${d1.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} – ${d2.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [visibleWeeks]);

  const numWeeks = visibleWeeks.length;
  const gridGapClass = viewMode === "12m" ? "gap-0.5" : "gap-1";

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full select-none">
      {/* Header: Clean Modern Sans-Serif Typography & Segmented Pill Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <Typography
            className="text-sm sm:text-base font-semibold tracking-tight text-foreground"
            type="h2"
            weight="bold"
          >
            {formatMinutesDisplay(visibleStats.focusMinutes)} of focus in{" "}
            {periodLabel}
          </Typography>
          <Typography className="text-xs mt-0.5" color="muted" type="body-xs">
            {dateRangeLabel} · {visibleStats.activeDays} active days (
            {visibleStats.consistency}% consistency)
          </Typography>
        </div>

        {/* Heatmap View Mode Switcher */}
        <Tabs
          selectedKey={viewMode}
          onSelectionChange={(k) => setViewMode(k as ViewMode)}
        >
          <Tabs.ListContainer className="rounded-full">
            <Tabs.List
              aria-label="Heatmap time span"
              className="rounded-full bg-surface/80 p-0.5 sm:p-1 border-separator/30 text-xs"
            >
              <Tabs.Tab
                className="h-6.5 sm:h-7 px-2.5 sm:px-3 whitespace-nowrap rounded-full text-xs font-medium cursor-pointer transition-colors"
                id="6m"
              >
                6 Months
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
              </Tabs.Tab>
              <Tabs.Tab
                className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full text-xs font-medium cursor-pointer transition-colors"
                id="12m"
              >
                1 Year
                <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Main Heatmap Grid Canvas (Pure decoupled Month Header + Uniform Day Grid) */}
      <div className="w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto scrollbar-thin pb-1"
        >
          <div
            className={`flex flex-col ${gridGapClass} w-full select-none ${
              viewMode === "12m" ? "min-w-125" : "min-w-85"
            }`}
          >
            {/* Top Month Header Row */}
            <div
              className={`flex items-center ${gridGapClass} w-full h-4 mb-0.5`}
            >
              <div className="w-5 sm:w-6 shrink-0 pointer-events-none" />
              <div
                className={`grid ${gridGapClass} flex-1 w-full`}
                style={{
                  gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))`,
                }}
              >
                {visibleWeeks.map((_, weekIdx) => {
                  const m = monthHeaders.find((h) => h.weekIndex === weekIdx);

                  return (
                    <div key={weekIdx} className="relative w-full h-full">
                      {m && (
                        <span className="absolute top-0 left-0 text-[10px] text-muted/85 font-medium whitespace-nowrap leading-none pointer-events-none">
                          {m.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7 Days of the Week Rows (Sunday = 0 to Saturday = 6) */}
            {[
              { label: "Sun", show: false },
              { label: "Mon", show: true },
              { label: "Tue", show: false },
              { label: "Wed", show: true },
              { label: "Thu", show: false },
              { label: "Fri", show: true },
              { label: "Sat", show: false },
            ].map((dayMeta, dayIdx) => (
              <div
                key={dayMeta.label}
                className={`flex items-center ${gridGapClass} w-full`}
              >
                {/* Day Label on Left (Mon, Wed, Fri) */}
                <span
                  className={`w-5 sm:w-6 shrink-0 text-[9px] text-muted/70 font-medium text-right pr-1 leading-none select-none pointer-events-none ${
                    dayMeta.show ? "" : "opacity-0"
                  }`}
                >
                  {dayMeta.label}
                </span>

                {/* Week Cells for this specific Day */}
                <div
                  className={`grid ${gridGapClass} flex-1 w-full`}
                  style={{
                    gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))`,
                  }}
                >
                  {visibleWeeks.map((week, weekIdx) => {
                    const day = week[dayIdx];

                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIdx}-${dayIdx}`}
                          className="w-full aspect-square rounded-sm opacity-0 pointer-events-none"
                        />
                      );
                    }

                    const isSelected = selectedDay?.dateStr === day.dateStr;
                    const tooltip = day.isFuture
                      ? `${day.fullDateLabel} (Upcoming)`
                      : day.focusMinutes > 0
                        ? `${formatMinutesDisplay(day.focusMinutes)} of focus on ${day.fullDateLabel}`
                        : `No focus activity on ${day.fullDateLabel}`;

                    return (
                      <button
                        key={day.dateStr}
                        aria-label={tooltip}
                        className={`w-full aspect-square rounded-sm sm:rounded-md border transition-transform duration-75 hover:scale-125 ${
                          day.isFuture ? "cursor-default" : "cursor-pointer"
                        } ${getContributionColor(day, isSelected)}`}
                        type="button"
                        onClick={() => {
                          if (!day.isFuture) {
                            setSelectedDay(isSelected ? null : day);
                          }
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();

                          setHoveredDay({
                            day,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Day Activity Inspector */}
      {selectedDay && (
        <div className="p-3.5 rounded-xl bg-surface-secondary/80 border border-separator/60 flex items-center justify-between gap-3 flex-wrap shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-accent/15 border border-accent/30 flex flex-col items-center justify-center text-accent font-bold shrink-0">
              <span className="text-[9px] uppercase leading-none">
                {new Date(`${selectedDay.dateStr}T12:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                  },
                )}
              </span>
              <span className="text-sm font-extrabold leading-tight">
                {new Date(`${selectedDay.dateStr}T12:00:00`).getDate()}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography
                className="text-xs font-bold text-foreground"
                type="body-xs"
              >
                {selectedDay.fullDateLabel}
              </Typography>
              <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                <span>
                  Focus:{" "}
                  <strong className="text-foreground font-semibold">
                    {formatMinutesDisplay(selectedDay.focusMinutes)}
                  </strong>
                </span>
                <span>
                  Pomodoros:{" "}
                  <strong className="text-foreground font-semibold">
                    {selectedDay.cycleCount}
                  </strong>
                </span>
                <span>
                  Tasks:{" "}
                  <strong className="text-foreground font-semibold">
                    {selectedDay.taskCompletedCount}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-7 px-3 rounded-full text-xs font-semibold bg-accent text-accent-foreground cursor-pointer shadow-2xs flex items-center gap-1"
              size="sm"
              variant="primary"
              onPress={() => onSelectDate?.(selectedDay.dateStr)}
            >
              <Calendar className="size-3.5" />
              <span>Filter Charts to this Day</span>
            </Button>
            <Button
              isIconOnly
              aria-label="Close selection"
              className="size-7 rounded-full text-muted hover:text-foreground"
              size="sm"
              variant="ghost"
              onPress={() => setSelectedDay(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Clean Footer: Pagination on Left, Less/More Legend on Right */}
      <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-separator/30 flex-wrap">
        {/* Left Side: Earlier / Recent Pagination for active view mode */}
        {viewMode === "6m" ? (
          <div className="flex items-center gap-1.5">
            <Button
              className="h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              isDisabled={page6m <= 1}
              size="sm"
              variant="secondary"
              onPress={() => setPage6m((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft className="size-3.5" />
              Earlier 6 Months
            </Button>
            <Button
              className="h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              isDisabled={page6m >= total6mPages}
              size="sm"
              variant="secondary"
              onPress={() => setPage6m((p) => Math.min(total6mPages, p + 1))}
            >
              Recent 6 Months
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              className="h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              isDisabled={page12m <= 1}
              size="sm"
              variant="secondary"
              onPress={() => setPage12m((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft className="size-3.5" />
              Earlier Year
            </Button>
            <Button
              className="h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              isDisabled={page12m >= total12mPages}
              size="sm"
              variant="secondary"
              onPress={() => setPage12m((p) => Math.min(total12mPages, p + 1))}
            >
              Recent Year
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Right Side: GitHub 5-Tier Intensity Legend */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Typography color="muted" type="body-xs">
            Less
          </Typography>
          <div className="flex items-center gap-1">
            <div className="size-2.5 rounded-xs bg-surface-secondary border border-separator/40" />
            <div className="size-2.5 rounded-xs bg-emerald-800/60 dark:bg-emerald-900/60 border border-emerald-800/50" />
            <div className="size-2.5 rounded-xs bg-emerald-600/80 border border-emerald-600" />
            <div className="size-2.5 rounded-xs bg-emerald-500 border border-emerald-500" />
            <div className="size-2.5 rounded-xs bg-emerald-400 border border-emerald-400" />
          </div>
          <Typography color="muted" type="body-xs">
            More
          </Typography>
        </div>
      </div>

      {/* Floating Hover Tooltip via Portal */}
      {hoveredDay &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed z-9999 pointer-events-none px-2.5 py-1.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-2xl text-xs -translate-x-1/2 min-w-36 animate-in fade-in zoom-in-95 duration-100 ${
              hoveredDay.y < 120
                ? "translate-y-2 mt-1"
                : "-translate-y-full -mt-2"
            }`}
            style={{
              left: Math.max(
                80,
                Math.min(
                  typeof window !== "undefined" ? window.innerWidth - 80 : 999,
                  hoveredDay.x,
                ),
              ),
              top: hoveredDay.y < 120 ? hoveredDay.y + 16 : hoveredDay.y,
            }}
          >
            <div className="flex flex-col gap-1">
              <Typography
                className="text-foreground text-xs font-semibold"
                type="body-xs"
              >
                {hoveredDay.day.fullDateLabel}{" "}
                {hoveredDay.day.isFuture && "(Upcoming)"}
              </Typography>
              <div className="flex items-center justify-between text-xs pt-0.5 border-t border-separator/40">
                <Typography color="muted" type="body-xs">
                  Focus:
                </Typography>
                <Typography className="font-bold text-accent" type="body-xs">
                  {hoveredDay.day.focusMinutes > 0
                    ? formatMinutesDisplay(hoveredDay.day.focusMinutes)
                    : "0m"}
                </Typography>
              </div>
              {hoveredDay.day.cycleCount > 0 && (
                <div className="flex items-center justify-between text-xs text-muted">
                  <Typography color="muted" type="body-xs">
                    Pomodoros:
                  </Typography>
                  <Typography
                    className="font-medium text-foreground"
                    type="body-xs"
                  >
                    {hoveredDay.day.cycleCount}{" "}
                    {hoveredDay.day.cycleCount === 1 ? "cycle" : "cycles"}
                  </Typography>
                </div>
              )}
              {hoveredDay.day.taskCompletedCount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <Typography className="text-emerald-400" type="body-xs">
                    Tasks done:
                  </Typography>
                  <Typography
                    className="font-medium text-emerald-400"
                    type="body-xs"
                  >
                    {hoveredDay.day.taskCompletedCount}
                  </Typography>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export { ActivityHeatmap as FocusGrid };
