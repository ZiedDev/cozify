import { Typography } from "@heroui/react";
import { BarChart2, TrendingUp, Calendar } from "lucide-react";

import { DayActivity } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

import { BarChart } from "@/components/ui/bar-chart";

interface FocusChartProps {
  data: DayActivity[];
  isHourly?: boolean;
}

export function FocusChart({ data }: FocusChartProps) {
  const isHourly = data.length === 24;

  const totalFocusInChart = data.reduce((acc, d) => acc + d.focusMinutes, 0);
  const activeIntervals = data.filter((d) => d.focusMinutes > 0).length;
  const avgFocusInChart =
    activeIntervals > 0 ? Math.round(totalFocusInChart / activeIntervals) : 0;

  const peakInterval = data.reduce(
    (max, curr) => (curr.focusMinutes > max.focusMinutes ? curr : max),
    data[0],
  );

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all w-full select-none">
      {/* Header with Title and Range Subtitle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <BarChart2 className="size-3.5" />
          </div>
          <div>
            <Typography type="body-sm" weight="semibold" className="text-sm text-foreground">
              Focus Trend
            </Typography>
            <Typography color="muted" type="body-xs" className="text-[11px] font-light">
              {isHourly
                ? "Hourly focus distribution for selected day"
                : "Focus time breakdown"}
            </Typography>
          </div>
        </div>

        {/* Focus total pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-separator/40 text-xs tabular-nums font-medium text-foreground">
          <Typography color="muted" type="body-xs" className="text-[11px]">
            Total:
          </Typography>
          <Typography type="body-xs" weight="semibold" className="text-accent">
            {formatMinutesDisplay(totalFocusInChart)}
          </Typography>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="relative w-full pt-2 pb-1">
        <BarChart
          data={data}
          height={165}
          margin={{ top: 12, right: 8, bottom: 22, left: 36 }}
        >
          <BarChart.Grid strokeDasharray="3 3" />
          <BarChart.YAxis
            tickFormatter={(v) => (v === 0 ? "0m" : `${v}m`)}
            ticksCount={3}
          />
          <BarChart.XAxis
            dataKey="dayLabel"
            tickFormatter={(val) => {
              if (isHourly) {
                // Show key hour markers: 12a, 3a, 6a, 9a, 12p, 3p, 6p, 9p
                const str = String(val);

                if (
                  str === "12a" ||
                  str === "3a" ||
                  str === "6a" ||
                  str === "9a" ||
                  str === "12p" ||
                  str === "3p" ||
                  str === "6p" ||
                  str === "9p"
                ) {
                  return str;
                }

                return "";
              }
              if (data.length <= 14) return val;

              return String(val).charAt(0);
            }}
          />
          {!isHourly && <BarChart.ReferenceLine label="1h Goal" y={60} />}
          <BarChart.Bar
            className="fill-accent/85 transition-all duration-200 cursor-pointer"
            dataKey="focusMinutes"
            hoverClassName="fill-accent"
            radius={4}
          />
          <BarChart.Tooltip
            content={({ item }) => (
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface border border-separator shadow-2xl z-50 pointer-events-none min-w-36 -translate-y-2">
                <div className="flex items-center gap-1.5 border-b border-separator/40 pb-1 text-muted text-[11px]">
                  <Calendar className="size-3 text-accent" />
                  <span>{item.fullDateLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-foreground pt-0.5">
                  <span>Focus:</span>
                  <span className="text-accent">
                    {formatMinutesDisplay(item.focusMinutes)}
                  </span>
                </div>
                {item.cycleCount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Pomodoros:</span>
                    <span className="font-medium text-foreground">
                      {item.cycleCount}{" "}
                      {item.cycleCount === 1 ? "cycle" : "cycles"}
                    </span>
                  </div>
                )}
                {item.taskCompletedCount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400">
                    <span>Tasks done:</span>
                    <span className="font-medium">
                      {item.taskCompletedCount} tasks
                    </span>
                  </div>
                )}
              </div>
            )}
          />
        </BarChart>
      </div>

      {/* Chart Footer Summary Cards */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-separator/30 text-center">
        <div className="flex flex-col items-center p-1.5 rounded-xl bg-surface-secondary border border-separator/30">
          <Typography color="muted" type="body-xs" className="text-[10px]">
            Period Total
          </Typography>
          <Typography type="body-xs" weight="semibold" className="text-xs sm:text-sm text-foreground tabular-nums">
            {formatMinutesDisplay(totalFocusInChart)}
          </Typography>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded-xl bg-surface-secondary border border-separator/30">
          <Typography color="muted" type="body-xs" className="text-[10px]">
            {isHourly ? "Active Hour Avg" : "Daily Average"}
          </Typography>
          <Typography type="body-xs" weight="semibold" className="text-xs sm:text-sm text-foreground tabular-nums">
            {formatMinutesDisplay(avgFocusInChart)}
          </Typography>
        </div>
        <div className="flex flex-col items-center p-1.5 rounded-xl bg-surface-secondary border border-separator/30">
          <Typography color="muted" type="body-xs" className="text-[10px]">
            {isHourly ? "Peak Hour" : "Peak Day"}
          </Typography>
          <Typography type="body-xs" weight="semibold" className="text-xs sm:text-sm text-accent tabular-nums flex items-center gap-1">
            <TrendingUp className="size-3" />
            {peakInterval && peakInterval.focusMinutes > 0
              ? `${formatMinutesDisplay(peakInterval.focusMinutes)}${isHourly ? ` (${peakInterval.dayLabel})` : ""}`
              : "—"}
          </Typography>
        </div>
      </div>
    </div>
  );
}
