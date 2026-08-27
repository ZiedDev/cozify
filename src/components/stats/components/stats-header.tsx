import { useState, useMemo } from "react";
import { Tabs, Button, Dropdown, Popover, RangeCalendar, Typography } from "@heroui/react";
import {
  Database,
  Download,
  Copy,
  MoreVertical,
  Trophy,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
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
  overallStats: OverallStats;
  milestones: Milestone[];
  onOpenAchievements: () => void;
  onLoadSampleData: () => void;
  onCopySummary: () => void;
  onExportJson: () => void;
  hasData: boolean;
}

const TIME_RANGES: { id: TimeRangeFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All" },
];

export function StatsHeader({
  range,
  onRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  overallStats: _overallStats,
  milestones,
  onOpenAchievements,
  onLoadSampleData,
  onCopySummary,
  onExportJson,
  hasData: _hasData,
}: StatsHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const unlockedMilestonesCount = useMemo(
    () => milestones.filter((m) => m.unlocked).length,
    [milestones],
  );
  const totalMilestonesCount = milestones.length;

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

  const handlePresetSelect = (filter: TimeRangeFilter) => {
    onCustomDateRangeChange(null);
    onRangeChange(filter);
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none pb-1">
      {/* Main Title & Subtitle Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Typography
              type="h1"
              className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-foreground"
            >
              Statistics
            </Typography>
            <Button
              aria-label="View Achievements & Trophies"
              className="h-6 px-2.5 rounded-full bg-surface border border-amber-500/35 hover:border-amber-400 hover:bg-amber-500/10 text-[11px] font-semibold text-amber-400 transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
              size="sm"
              variant="secondary"
              onPress={onOpenAchievements}
            >
              <Trophy className="size-3" />
              <span>
                {unlockedMilestonesCount}/{totalMilestonesCount}
              </span>
            </Button>
          </div>
          <Typography color="muted" type="body-xs" className="font-light mt-0.5">
            Track your focus momentum, habits, and execution
          </Typography>
        </div>

        {/* Right Side: Range Tabs, Custom Picker & Overflow Menu */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Time Range Animated Tabs */}
          <Tabs
            selectedKey={customDateRange ? "" : range}
            onSelectionChange={(k) => {
              if (k) {
                handlePresetSelect(k as TimeRangeFilter);
              }
            }}
          >
            <Tabs.ListContainer className="rounded-full">
              <Tabs.List
                aria-label="Time Range Filter"
                className="rounded-full bg-surface-secondary p-0.5 border border-separator/40 text-xs shadow-2xs"
              >
                {TIME_RANGES.map((item) => (
                  <Tabs.Tab
                    key={item.id}
                    className="h-7 px-2.5 sm:px-3 rounded-full text-xs font-medium cursor-pointer transition-all"
                    id={item.id}
                  >
                    <span>{item.label}</span>
                    <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground shadow-2xs" />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          {/* Custom Date Range Popover Button */}
          <Popover isOpen={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <Popover.Trigger>
              <Button
                aria-label="Custom Date Range Filter"
                className={`h-8 px-2.5 sm:px-3 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all shadow-xs ${
                  customDateRange
                    ? "bg-accent text-accent-foreground font-semibold shadow-accent/20"
                    : "bg-surface-secondary border border-separator/40 text-muted hover:text-foreground"
                }`}
                size="sm"
                variant={customDateRange ? "primary" : "secondary"}
              >
                <CalendarIcon className="size-3.5 shrink-0" />
                <span>
                  {customDateRange
                    ? `${customDateRange.start} – ${customDateRange.end}`
                    : "Custom"}
                </span>
                {customDateRange && (
                  <span
                    aria-label="Clear custom date range"
                    className="ml-0.5 hover:bg-black/20 rounded-full p-0.5"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCustomDateRangeChange(null);
                      onRangeChange("all");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onCustomDateRangeChange(null);
                        onRangeChange("all");
                      }
                    }}
                  >
                    <X className="size-3" />
                  </span>
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Content className="p-3 bg-surface rounded-2xl border border-separator shadow-2xl z-50">
              <div className="flex flex-col gap-2.5">
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
                        onRangeChange("all");
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
              </div>
            </Popover.Content>
          </Popover>

          {/* Quick Actions Dropdown Menu */}
          <Dropdown>
            <Dropdown.Trigger>
              <Button
                aria-label="More statistics actions"
                className="size-8 rounded-full bg-surface-secondary border border-separator/40 text-muted hover:text-foreground flex items-center justify-center cursor-pointer shadow-xs"
                size="sm"
                variant="secondary"
              >
                <MoreVertical className="size-4" />
              </Button>
            </Dropdown.Trigger>

            <Dropdown.Popover className="rounded-2xl min-w-44 p-1 shadow-xl bg-surface border border-separator/60">
              <Dropdown.Menu aria-label="Statistics actions">
                <Dropdown.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-surface-secondary"
                  id="copy"
                  onAction={onCopySummary}
                >
                  <Copy className="size-3.5 text-accent" />
                  <span>Copy Summary</span>
                </Dropdown.Item>

                <Dropdown.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-surface-secondary"
                  id="export"
                  onAction={onExportJson}
                >
                  <Download className="size-3.5 text-blue-400" />
                  <span>Export JSON</span>
                </Dropdown.Item>

                <Dropdown.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-surface-secondary"
                  id="sample"
                  onAction={onLoadSampleData}
                >
                  <Database className="size-3.5 text-emerald-400" />
                  <span>Load Sample Data</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
