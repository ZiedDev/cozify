import { useState, useEffect, memo } from "react";
import { Typography, Button } from "@heroui/react";
import { BarChart2, TrendingUp, Calendar, Filter, X } from "lucide-react";

import { DayActivity } from "../types";
import { formatMinutesDisplay } from "../logic/stats-calculator";

import { BarChart } from "@/components/ui/bar-chart";

function FocusChartComponent({
  data,
  onSelectRange,
}: {
  data: DayActivity[];
  onSelectRange?: (range: { start: string; end: string }) => void;
}) {
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
    (totalMinutes, dayActivity) =>
      totalMinutes +
      (dayActivity.totalPeriodMinutes ?? dayActivity.focusMinutes),
    0,
  );
  const avgFocusInChart =
    data.length > 0
      ? Math.round(
          data.reduce(
            (totalMinutes, dayActivity) =>
              totalMinutes + dayActivity.focusMinutes,
            0,
          ) / data.length,
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
    <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors w-full select-none overflow-visible">
      {/* Header matching Productivity Rhythm & Category Breakdown */}
      <div className="flex items-start justify-between gap-2 mb-1 pb-2 border-b border-separator/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-foreground text-xs sm:text-sm font-semibold">
            <BarChart2 className="size-3.5 text-accent shrink-0" />
            <span>Focus Trend</span>
          </div>
          <Typography
            className="text-xs font-light mt-0.5"
            color="muted"
            type="body-xs"
          >
            {getSubtitle()}
          </Typography>
        </div>

        {/* Peak indicator badge matching other cards */}
        {peakInterval && peakInterval.focusMinutes > 0 ? (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25 font-medium shrink-0">
            <TrendingUp className="size-3" />
            <span>
              {getPeakLabel()}:{" "}
              {formatMinutesDisplay(peakInterval.focusMinutes)}
            </span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-secondary border border-separator/40 text-xs tabular-nums font-medium text-foreground shrink-0">
            <span className="text-muted font-normal">Total:</span>
            <span className="text-accent font-semibold">
              {formatMinutesDisplay(totalFocusInChart)}
            </span>
          </div>
        )}
      </div>

      {/* Main Bar Chart Container */}
      <div className="relative w-full overflow-visible">
        <BarChart
          data={data}
          onItemClick={(item) => {
            const raw = (item as any)?.payload ?? item;
            const day = raw as DayActivity;

            setSelectedDay((prev) =>
              prev?.dateStr === day.dateStr && prev?.dayLabel === day.dayLabel
                ? null
                : day,
            );
          }}
        >
          <BarChart.Grid />
          <BarChart.YAxis
            tickFormatter={(minutesValue) =>
              minutesValue === 0 ? "0m" : `${minutesValue}m`
            }
            ticksCount={4}
          />
          <BarChart.XAxis
            dataKey="dayLabel"
            tickFormatter={(tickValue, itemIndex) => {
              if (isHourly) {
                const hourString = String(tickValue);

                if (
                  hourString === "12 AM" ||
                  hourString === "4 AM" ||
                  hourString === "8 AM" ||
                  hourString === "12 PM" ||
                  hourString === "4 PM" ||
                  hourString === "8 PM"
                ) {
                  return hourString;
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
                itemIndex % step === 0 ||
                (itemIndex === count - 1 &&
                  (count - 1) % step >= Math.floor(step / 2))
              ) {
                return String(tickValue);
              }

              return "";
            }}
          />
          {avgFocusInChart > 0 && (
            <BarChart.ReferenceLine
              className="stroke-accent/70 text-right"
              label={`Avg: ${formatMinutesDisplay(avgFocusInChart)}`}
              strokeDasharray="4 4"
              y={avgFocusInChart}
            />
          )}
          <BarChart.Bar
            className="fill-accent/85 transition-all duration-150 cursor-pointer"
            dataKey="focusMinutes"
            maxBarSize={26}
            radius={[3, 3, 0, 0]}
          >
            {data.map((entry, index) => {
              const isSelected =
                selectedDay &&
                selectedDay.dateStr === entry.dateStr &&
                selectedDay.dayLabel === entry.dayLabel;
              const hasSelection = Boolean(selectedDay);

              return (
                <BarChart.Cell
                  key={`cell-${index}`}
                  className="cursor-pointer transition-all duration-150"
                  fill="var(--accent)"
                  fillOpacity={isSelected ? 1 : hasSelection ? 0.35 : 0.85}
                  stroke={isSelected ? "var(--foreground)" : "none"}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </BarChart.Bar>

          {/* Desktop Mouse Hover Tooltip */}
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

                {item.overtimeMinutes && item.overtimeMinutes > 0 ? (
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Overtime:</span>
                    <span className="font-medium text-accent">
                      +{formatMinutesDisplay(item.overtimeMinutes)}
                    </span>
                  </div>
                ) : null}

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
              </div>
            )}
          />
        </BarChart>
      </div>

      {/* Selected Day/Interval Activity Inspector */}
      {selectedDay && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-surface-secondary/80 border border-separator/50 flex items-center justify-between gap-2.5 flex-wrap shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-accent/15 border border-accent/30 flex flex-col items-center justify-center text-accent font-bold shrink-0">
              <span className="text-[8px] uppercase leading-none">
                {isHourly ? "Hour" : selectedDay.dayLabel}
              </span>
              <span className="text-xs font-extrabold leading-tight">
                {isHourly
                  ? selectedDay.dayLabel
                  : (() => {
                      if (!selectedDay.dateStr) return selectedDay.dayLabel;
                      const parsedDate = new Date(
                        selectedDay.dateStr.includes("T")
                          ? selectedDay.dateStr
                          : `${selectedDay.dateStr}T12:00:00`,
                      );
                      const dayNumber = parsedDate.getDate();

                      return isNaN(dayNumber) ? selectedDay.dayLabel : dayNumber;
                    })()}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography
                className="text-xs font-semibold text-foreground"
                type="body-xs"
              >
                {selectedDay.fullDateLabel}
              </Typography>
              <div className="flex items-center gap-2.5 text-xs text-muted mt-0.5 flex-wrap">
                <span>
                  Focus:{" "}
                  <strong className="text-foreground font-semibold">
                    {formatMinutesDisplay(selectedDay.focusMinutes)}
                    {isWeekly || isMonthly ? "/day" : ""}
                  </strong>
                </span>
                {selectedDay.overtimeMinutes &&
                selectedDay.overtimeMinutes > 0 ? (
                  <span className="text-accent font-medium">
                    +{formatMinutesDisplay(selectedDay.overtimeMinutes)}
                  </span>
                ) : null}
                {(isWeekly || isMonthly) &&
                  selectedDay.totalPeriodMinutes !== undefined && (
                    <span>
                      Total:{" "}
                      <strong className="text-foreground font-semibold">
                        {formatMinutesDisplay(selectedDay.totalPeriodMinutes)}
                      </strong>
                    </span>
                  )}
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

          <div className="flex items-center gap-1.5">
            {!isHourly && selectedDay.dateRange && onSelectRange && (
              <Button
                className="h-6.5 px-2.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground cursor-pointer shadow-2xs flex items-center gap-1"
                size="sm"
                variant="primary"
                onPress={() => {
                  onSelectRange(selectedDay.dateRange!);
                  setSelectedDay(null);
                }}
              >
                <Filter className="size-3" />
                <span>Filter</span>
              </Button>
            )}
            <Button
              isIconOnly
              aria-label="Close selection"
              className="size-6.5 rounded-full text-muted hover:text-foreground cursor-pointer"
              size="sm"
              variant="ghost"
              onPress={() => setSelectedDay(null)}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Chart Footer Metrics */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-separator/20 text-xs">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
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

        {peakInterval && peakInterval.focusMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-right shrink-0">
            <span className="text-muted flex items-center gap-1">
              <TrendingUp className="size-3 text-accent" />
              <span>{getPeakLabel()}:</span>
            </span>
            <span className="font-semibold text-accent tabular-nums">
              {formatMinutesDisplay(peakInterval.focusMinutes)}
              {isHourly || isWeekly || isMonthly
                ? ` (${peakInterval.dayLabel})`
                : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const FocusChart = memo(FocusChartComponent);
