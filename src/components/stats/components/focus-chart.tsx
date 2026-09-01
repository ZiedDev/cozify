import { useState, useEffect } from "react";
import { Typography } from "@heroui/react";
import {
  BarChart2,
  TrendingUp,
  Calendar,
  Filter,
  X,
  Clock,
  Target,
  CheckCircle2,
} from "lucide-react";

import { DayActivity } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

import { BarChart } from "@/components/ui/bar-chart";

interface FocusChartProps {
  data: DayActivity[];
  isHourly?: boolean;
  onSelectRange?: (range: { start: string; end: string }) => void;
}

export function FocusChart({ data, onSelectRange }: FocusChartProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  // Clear touch selection when time range filter changes
  useEffect(() => {
    setSelectedDay(null);
  }, [data]);

  const periodType =
    data[0]?.periodType || (data.length === 24 ? "hourly" : "daily");
  const isHourly = periodType === "hourly";
  const isWeekly = periodType === "weekly";
  const isMonthly = periodType === "monthly";

  const totalFocusInChart = data.reduce(
    (acc, d) => acc + (d.totalPeriodMinutes ?? d.focusMinutes),
    0,
  );
  const avgFocusInChart =
    data.length > 0
      ? Math.round(
          data.reduce((acc, d) => acc + d.focusMinutes, 0) / data.length,
        )
      : 0;

  const peakInterval = data.reduce(
    (max, curr) => (curr.focusMinutes > max.focusMinutes ? curr : max),
    data[0],
  );

  const getSubtitle = () => {
    if (isHourly) return "Hourly focus distribution";
    if (isWeekly) return "Weekly focus trend";
    if (isMonthly) return "Monthly focus trend";

    return "Daily focus time breakdown";
  };

  const getPeakLabel = () => {
    if (isHourly) return "Peak Hour";
    if (isWeekly) return "Peak Week";
    if (isMonthly) return "Peak Month";

    return "Peak Day";
  };

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full select-none overflow-visible">
      {/* Header matching Summary Widget (Clean icon without boxed background) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <BarChart2 className="size-3.5 text-accent" />
            <span>Focus Trend</span>
          </div>
          <Typography
            className="text-xs text-muted/80 font-light mt-0.5"
            type="body-xs"
          >
            {getSubtitle()}
          </Typography>
        </div>

        {/* Focus total pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-separator/40 text-xs tabular-nums font-medium text-foreground shrink-0">
          <span className="text-muted font-normal">Total:</span>
          <span className="text-accent font-semibold">
            {formatMinutesDisplay(totalFocusInChart)}
          </span>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="relative w-full pt-1 pb-1 overflow-visible">
        <BarChart
          data={data}
          height={190}
          margin={{ top: 14, right: 10, bottom: 28, left: 36 }}
          onItemClick={(item) => {
            const isTouch =
              typeof window !== "undefined" &&
              (window.matchMedia("(pointer: coarse)").matches ||
                "ontouchstart" in window ||
                navigator.maxTouchPoints > 0);

            if (isTouch) {
              setSelectedDay(item as DayActivity);
            } else if (!isHourly) {
              // Direct 1-click filter for desktop mouse (disabled when in hourly view)
              const day = item as DayActivity;

              if (onSelectRange && day.dateRange) {
                onSelectRange(day.dateRange);
              }
            }
          }}
        >
          <BarChart.Grid
            className="stroke-separator/85"
            strokeDasharray="4 4"
          />
          <BarChart.YAxis
            tickFormatter={(v) => (v === 0 ? "0m" : `${v}m`)}
            ticksCount={3}
          />
          <BarChart.XAxis
            dataKey="dayLabel"
            tickFormatter={(val, idx) => {
              if (isHourly) {
                const str = String(val);

                if (
                  str === "12 AM" ||
                  str === "4 AM" ||
                  str === "8 AM" ||
                  str === "12 PM" ||
                  str === "4 PM" ||
                  str === "8 PM"
                ) {
                  return str;
                }

                return "";
              }

              const count = data.length;
              let step = 1;

              if (count > 30) {
                step = Math.ceil(count / 6);
              } else if (count > 16) {
                step = Math.ceil(count / 7);
              } else if (count > 8) {
                step = 2;
              }

              if (
                idx % step === 0 ||
                (idx === count - 1 &&
                  (count - 1) % step >= Math.floor(step / 2))
              ) {
                return String(val);
              }

              return "";
            }}
          />
          {avgFocusInChart > 0 && (
            <BarChart.ReferenceLine
              className="stroke-accent/80"
              label={`Avg: ${formatMinutesDisplay(avgFocusInChart)}`}
              strokeDasharray="5 4"
              y={avgFocusInChart}
            />
          )}
          <BarChart.Bar
            className={`fill-accent/85 transition-[fill,opacity] duration-200 ${isHourly ? "cursor-default" : "cursor-pointer"}`}
            dataKey="focusMinutes"
            hoverClassName="fill-accent"
            radius={4}
          />

          {/* Pure Desktop Mouse Hover Tooltip (Only on desktop screens sm+) */}
          <BarChart.Tooltip
            content={({ item }) => (
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-surface/95 backdrop-blur-md border border-separator/90 shadow-2xl z-50 min-w-40 text-left select-none pointer-events-none">
                <div className="flex items-center gap-1.5 border-b border-separator/40 pb-1 text-xs font-medium text-foreground">
                  <Calendar className="size-3.5 text-accent shrink-0" />
                  <span>{item.fullDateLabel}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>
                    {isWeekly || isMonthly ? "Daily Avg:" : "Focus Time:"}
                  </span>
                  <span className="text-accent">
                    {formatMinutesDisplay(item.focusMinutes)}
                    {isWeekly || isMonthly ? "/day" : ""}
                  </span>
                </div>

                {(isWeekly || isMonthly) &&
                  item.totalPeriodMinutes !== undefined && (
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>Total Focus:</span>
                      <span className="font-medium text-foreground">
                        {formatMinutesDisplay(item.totalPeriodMinutes)}
                      </span>
                    </div>
                  )}

                {item.cycleCount > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Pomodoros:</span>
                    <span className="font-medium text-foreground">
                      {item.cycleCount}{" "}
                      {item.cycleCount === 1 ? "cycle" : "cycles"}
                    </span>
                  </div>
                )}

                {item.taskCompletedCount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-400">
                    <span>Tasks done:</span>
                    <span className="font-medium">
                      {item.taskCompletedCount}{" "}
                      {item.taskCompletedCount === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                )}

                {!isHourly && onSelectRange && item.dateRange && (
                  <div className="flex items-center gap-1 text-xs text-accent/90 font-medium pt-1 border-t border-separator/30">
                    <Filter className="size-3 shrink-0" />
                    <span>Click to filter</span>
                  </div>
                )}
              </div>
            )}
          />
        </BarChart>
      </div>

      {/* Dedicated Touch Card on Phone (Rock-solid, never hides while tapping, 100% clickable) */}
      {selectedDay && (
        <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface-secondary border border-separator/50 shadow-sm animate-in fade-in zoom-in-95 duration-150 select-none block sm:hidden">
          <div className="flex items-center justify-between border-b border-separator/30 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Calendar className="size-3.5 text-accent shrink-0" />
              <span>{selectedDay.fullDateLabel}</span>
            </div>
            <button
              aria-label="Close details"
              className="size-5 rounded-full flex items-center justify-center bg-surface hover:bg-surface-secondary text-muted hover:text-foreground transition-colors cursor-pointer"
              type="button"
              onClick={() => setSelectedDay(null)}
            >
              <X className="size-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col p-1.5 rounded-lg bg-surface/60 border border-separator/20">
              <span className="text-muted text-[11px] flex items-center gap-1">
                <Clock className="size-3 text-accent" />
                {isWeekly || isMonthly ? "Daily Avg" : "Focus Time"}
              </span>
              <span className="font-bold text-accent text-sm tabular-nums mt-0.5">
                {formatMinutesDisplay(selectedDay.focusMinutes)}
              </span>
            </div>

            <div className="flex flex-col p-1.5 rounded-lg bg-surface/60 border border-separator/20">
              <span className="text-muted text-[11px] flex items-center gap-1">
                <Target className="size-3 text-purple-400" />
                Pomodoros
              </span>
              <span className="font-bold text-foreground text-sm tabular-nums mt-0.5">
                {selectedDay.cycleCount}
              </span>
            </div>

            <div className="flex flex-col p-1.5 rounded-lg bg-surface/60 border border-separator/20">
              <span className="text-muted text-[11px] flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-400" />
                Tasks
              </span>
              <span className="font-bold text-emerald-400 text-sm tabular-nums mt-0.5">
                {selectedDay.taskCompletedCount}
              </span>
            </div>
          </div>

          {!isHourly && selectedDay.dateRange && onSelectRange && (
            <button
              className="w-full h-7 px-3 rounded-lg text-xs font-semibold bg-accent text-accent-foreground flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs mt-0.5"
              type="button"
              onClick={() => {
                onSelectRange(selectedDay.dateRange!);
                setSelectedDay(null);
              }}
            >
              <Filter className="size-3 shrink-0" />
              <span>Filter by this</span>
            </button>
          )}
        </div>
      )}

      {/* Chart Footer Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2.5 border-t border-separator/30 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Total:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatMinutesDisplay(totalFocusInChart)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted">
              {isHourly ? "Hourly Avg:" : "Daily Avg:"}
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatMinutesDisplay(avgFocusInChart)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-separator/20">
          <span className="text-muted flex items-center gap-1">
            <TrendingUp className="size-3.5 text-accent" />
            <span>{getPeakLabel()}:</span>
          </span>
          <span className="font-semibold text-accent tabular-nums">
            {peakInterval && peakInterval.focusMinutes > 0
              ? `${formatMinutesDisplay(peakInterval.focusMinutes)}${isHourly || isWeekly || isMonthly ? ` (${peakInterval.dayLabel})` : ""}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
