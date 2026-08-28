import { useState, useMemo, useRef, useEffect } from "react";
import {
  Tabs,
  Button,
  Popover,
  RangeCalendar,
  Typography,
} from "@heroui/react";
import { Trophy, Calendar as CalendarIcon, X } from "lucide-react";
import {
  parseDate,
  today,
  getLocalTimeZone,
  DateValue,
} from "@internationalized/date";

import {
  TimeRangeFilter,
  CustomDateRange,
  OverallStats,
  Milestone,
} from "../types";

interface StatsHeaderProps {
  range: TimeRangeFilter;
  onRangeChange: (r: TimeRangeFilter) => void;
  customDateRange: CustomDateRange | null;
  onCustomDateRangeChange: (r: CustomDateRange | null) => void;
  overallStats?: OverallStats;
  milestones: Milestone[];
  onOpenAchievements: () => void;
  hasData?: boolean;
}

const TIME_RANGES: { id: TimeRangeFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];

const formatToDDMMYY = (dateStr: string) => {
  const parts = dateStr.split("-");

  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(-2);
  const mm = m.padStart(2, "0");
  const dd = d.padStart(2, "0");

  return `${dd}/${mm}/${yy}`;
};

export function StatsHeader({
  range,
  onRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  overallStats: _overallStats,
  milestones,
  onOpenAchievements,
  hasData: _hasData,
}: StatsHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const customTabRef = useRef<HTMLDivElement>(null);
  const previousRangeRef = useRef<TimeRangeFilter>(
    range !== "custom" ? range : "week",
  );

  // Keep track of the last non-custom range
  useEffect(() => {
    if (range !== "custom") {
      previousRangeRef.current = range;
    }
  }, [range]);

  const unlockedMilestonesCount = useMemo(
    () => milestones.filter((m) => m.unlocked).length,
    [milestones],
  );
  const totalMilestonesCount = milestones.length;

  const customTabLabel = useMemo(() => {
    if (range === "custom" && customDateRange?.start && customDateRange?.end) {
      const startStr = formatToDDMMYY(customDateRange.start);
      const endStr = formatToDDMMYY(customDateRange.end);

      if (customDateRange.start === customDateRange.end) {
        return startStr;
      }

      return `${startStr} - ${endStr}`;
    }

    return "Custom";
  }, [range, customDateRange]);

  // Controlled calendar value
  const calendarValue = useMemo<{
    start: DateValue;
    end: DateValue;
  } | null>(() => {
    if (customDateRange?.start && customDateRange?.end) {
      try {
        return {
          start: parseDate(customDateRange.start),
          end: parseDate(customDateRange.end),
        };
      } catch {
        return null;
      }
    }

    return null;
  }, [customDateRange]);

  const handleCalendarChange = (
    val: { start: DateValue; end: DateValue } | null,
  ) => {
    if (val?.start && val?.end) {
      onCustomDateRangeChange({
        start: val.start.toString(),
        end: val.end.toString(),
      });
      onRangeChange("custom");
      setIsCalendarOpen(false);
    }
  };

  const handleSelectionChange = (key: React.Key | null) => {
    if (!key) return;
    const filter = key as TimeRangeFilter;

    if (filter === "custom") {
      setIsCalendarOpen(true);

      return;
    }

    previousRangeRef.current = filter;
    onCustomDateRangeChange(null);
    onRangeChange(filter);
    setIsCalendarOpen(false);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
  };

  return (
    <div className="flex flex-col gap-2.5 md:gap-3 w-full shrink-0 select-none">
      {/* Top row: Title + Trophy Counter & Quick Actions Dropdown */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full flex-nowrap">
        {/* Left Title & Achievements Badge */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
          <Typography
            className="text-xl md:text-2xl lg:text-3xl font-serif font-medium tracking-tight text-foreground select-none"
            type="h1"
          >
            Statistics
          </Typography>

          <Button
            aria-label="View achievements and trophies"
            className="flex items-center px-2 md:px-2.5 py-0.5 h-6 md:h-7 rounded-full text-[11px] md:text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1.5 cursor-pointer transition-all hover:bg-amber-500/25 shadow-2xs"
            size="sm"
            variant="ghost"
            onPress={onOpenAchievements}
          >
            <Trophy className="size-3" />
            <span className="tabular-nums">
              {unlockedMilestonesCount}/{totalMilestonesCount}
            </span>
          </Button>
        </div>
      </div>

      {/* Bottom row: Filter Tabs & Custom Date Picker */}
      <div className="flex items-center justify-between gap-2 md:gap-3 w-full flex-nowrap border-b border-separator/30 pb-2 overflow-hidden">
        <div className="flex items-center rounded-full text-xs shrink-0">
          {range === "custom" && customDateRange ? (
            <div
              ref={customTabRef}
              className="h-6.5 md:h-7 pl-2.5 md:pl-3 pr-1.5 md:pr-2 rounded-full text-[11px] md:text-xs font-semibold bg-accent text-accent-foreground flex items-center gap-1.5 shadow-2xs cursor-pointer select-none transition-all"
              role="button"
              tabIndex={0}
              onClick={() => setIsCalendarOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setIsCalendarOpen(true);
                }
              }}
            >
              <CalendarIcon className="size-3 shrink-0" />
              <span>{customTabLabel}</span>
              <button
                aria-label="Clear custom date range"
                className="size-4 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/25 dark:bg-white/15 dark:hover:bg-white/30 text-accent-foreground/90 hover:text-accent-foreground transition-all cursor-pointer ml-0.5"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomDateRangeChange(null);
                  onRangeChange(previousRangeRef.current || "week");
                  setIsCalendarOpen(false);
                }}
              >
                <X className="size-2.5" />
              </button>
            </div>
          ) : (
            <Tabs selectedKey={range} onSelectionChange={handleSelectionChange}>
              <Tabs.ListContainer className="rounded-full">
                <Tabs.List
                  aria-label="Time Range Filters"
                  className="rounded-full bg-surface/80 p-0.5 sm:p-1 border-separator/30 text-xs"
                >
                  {TIME_RANGES.map((item) => {
                    const isCustom = item.id === "custom";

                    return (
                      <Tabs.Tab
                        key={item.id}
                        ref={isCustom ? customTabRef : undefined}
                        className="h-6.5 md:h-7 px-2 md:px-3 rounded-full text-[11px] md:text-xs font-medium cursor-pointer transition-all flex items-center gap-1"
                        id={item.id}
                        onClick={
                          isCustom
                            ? () => {
                                setIsCalendarOpen(true);
                              }
                            : undefined
                        }
                      >
                        {isCustom && (
                          <CalendarIcon className="size-3 shrink-0" />
                        )}
                        <span>{isCustom ? customTabLabel : item.label}</span>
                        <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                      </Tabs.Tab>
                    );
                  })}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          )}

          {/* Standalone Popover anchored to the Custom Tabs.Tab / Custom Pill */}
          <Popover.Content
            className="p-3 bg-surface rounded-2xl border border-separator shadow-2xl z-50"
            isOpen={isCalendarOpen}
            placement="bottom end"
            triggerRef={customTabRef}
            onOpenChange={handlePopoverOpenChange}
          >
            <Popover.Dialog className="flex flex-col gap-2.5 outline-none">
              <div className="flex items-center justify-between border-b border-separator/40 pb-2">
                <span className="text-xs font-semibold text-foreground">
                  Filter Date Range
                </span>
                {customDateRange && (
                  <Button
                    className="text-[10px] h-5 px-2 rounded-lg text-muted hover:text-danger"
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      onCustomDateRangeChange(null);
                      onRangeChange(previousRangeRef.current || "week");
                      setIsCalendarOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>

              <RangeCalendar
                aria-label="Statistics custom date range"
                className="rounded-xl border-none shadow-none text-xs"
                maxValue={today(getLocalTimeZone())}
                value={calendarValue || undefined}
                onChange={handleCalendarChange}
              >
                <RangeCalendar.Header className="flex items-center justify-between pb-2">
                  <RangeCalendar.NavButton
                    className="size-7 rounded-lg hover:bg-surface-secondary"
                    slot="previous"
                  />
                  <RangeCalendar.Heading className="text-xs font-semibold text-foreground" />
                  <RangeCalendar.NavButton
                    className="size-7 rounded-lg hover:bg-surface-secondary"
                    slot="next"
                  />
                </RangeCalendar.Header>
                <RangeCalendar.Grid className="w-full">
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell className="text-[10px] font-medium text-muted">
                        {day}
                      </RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => (
                      <RangeCalendar.Cell
                        className="size-7 text-xs rounded-lg"
                        date={date}
                      />
                    )}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
              </RangeCalendar>
            </Popover.Dialog>
          </Popover.Content>
        </div>
      </div>
    </div>
  );
}
