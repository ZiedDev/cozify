import {
  Flame,
  Award,
  Zap,
  Target,
  Clock,
  Sun,
  Moon,
  CheckCircle2,
  Trophy,
  Medal,
  Star,
  Shield,
  Crown,
  Compass,
  Rocket,
  Coffee,
  Layers,
  Flag,
  Bookmark,
} from "lucide-react";

import {
  TimeRangeFilter,
  CustomDateRange,
  DayActivity,
  TimeOfDayStat,
  TagStat,
  PriorityStat,
  Milestone,
  OverallStats,
} from "../types";

import { SessionRecord } from "@/services/storage";
import {
  TodoItem,
  PRESET_TAGS,
  PRIORITY_CONFIG,
} from "@/components/todo/types";

/**
 * Formats minutes into human readable string like "2h 45m" or "35m"
 */
export function formatMinutesDisplay(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }

  return `${mins}m`;
}

/**
 * Formats epoch timestamp into clean localized date string
 */
export function formatSessionDateTime(timestamp: number): {
  date: string;
  time: string;
  relative: string;
} {
  const date = new Date(timestamp);
  const now = new Date();

  // Localized date and time
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Relative calculation
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 86400000;

  let relative = dateStr;

  if (timestamp >= startOfToday) {
    relative = "Today";
  } else if (timestamp >= startOfYesterday) {
    relative = "Yesterday";
  } else {
    const diffDays = Math.floor((startOfToday - timestamp) / 86400000);

    if (diffDays <= 7) {
      relative = `${diffDays} days ago`;
    }
  }

  return { date: dateStr, time: timeStr, relative };
}

/**
 * Filter sessions by the selected time range
 */
export function filterSessionsByRange(
  sessions: SessionRecord[],
  range: TimeRangeFilter,
  customRange?: CustomDateRange | null,
): SessionRecord[] {
  if (range === "all") return sessions;

  if (range === "custom" && customRange?.start && customRange?.end) {
    const startTs = new Date(`${customRange.start}T00:00:00`).getTime();
    const endTs = new Date(`${customRange.end}T23:59:59.999`).getTime();

    return sessions.filter(
      (s) => s.createdAt >= startTs && s.createdAt <= endTs,
    );
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  if (range === "today") {
    return sessions.filter((s) => s.createdAt >= startOfToday);
  }

  if (range === "week") {
    // Last 7 days
    const sevenDaysAgo = startOfToday - 6 * 86400000;

    return sessions.filter((s) => s.createdAt >= sevenDaysAgo);
  }

  if (range === "month") {
    // Last 30 days
    const thirtyDaysAgo = startOfToday - 29 * 86400000;

    return sessions.filter((s) => s.createdAt >= thirtyDaysAgo);
  }

  return sessions;
}

/**
 * Filter todos by the selected time range
 */
export function filterTodosByRange(
  todos: TodoItem[],
  range: TimeRangeFilter,
  customRange?: CustomDateRange | null,
): TodoItem[] {
  if (range === "all") return todos;

  const getTodoTimestamp = (t: TodoItem) => t.completedAt || t.createdAt;

  if (range === "custom" && customRange?.start && customRange?.end) {
    const startTs = new Date(`${customRange.start}T00:00:00`).getTime();
    const endTs = new Date(`${customRange.end}T23:59:59.999`).getTime();

    return todos.filter((t) => {
      const ts = getTodoTimestamp(t);

      return ts >= startTs && ts <= endTs;
    });
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  if (range === "today") {
    return todos.filter((t) => getTodoTimestamp(t) >= startOfToday);
  }

  if (range === "week") {
    const sevenDaysAgo = startOfToday - 6 * 86400000;

    return todos.filter((t) => getTodoTimestamp(t) >= sevenDaysAgo);
  }

  if (range === "month") {
    const thirtyDaysAgo = startOfToday - 29 * 86400000;

    return todos.filter((t) => getTodoTimestamp(t) >= thirtyDaysAgo);
  }

  return todos;
}

/**
 * Calculates current streak and best streak from sessions and completed todos
 */
export function calculateStreaks(
  sessions: SessionRecord[],
  todos: TodoItem[],
): { currentStreak: number; bestStreak: number; totalActiveDays: number } {
  const activeDateSet = new Set<string>();

  // Collect active dates from sessions
  sessions.forEach((s) => {
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    activeDateSet.add(dateStr);
  });

  // Collect active dates from completed todos
  todos.forEach((t) => {
    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      activeDateSet.add(dateStr);
    }
  });

  const totalActiveDays = activeDateSet.size;

  if (totalActiveDays === 0) {
    return { currentStreak: 0, bestStreak: 0, totalActiveDays: 0 };
  }

  const now = new Date();
  const toDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Current streak calculation
  let currentStreak = 0;
  const checkDate = new Date(now);

  const todayStr = toDateStr(checkDate);
  const hadActivityToday = activeDateSet.has(todayStr);

  if (hadActivityToday) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday was active
    checkDate.setDate(checkDate.getDate() - 1);
    if (!activeDateSet.has(toDateStr(checkDate))) {
      currentStreak = 0;
    }
  }

  if (hadActivityToday || activeDateSet.has(toDateStr(checkDate))) {
    while (activeDateSet.has(toDateStr(checkDate))) {
      if (!hadActivityToday && currentStreak === 0) {
        currentStreak = 1;
      } else {
        currentStreak += 1;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Best streak calculation across all historical dates
  const sortedDates = Array.from(activeDateSet).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (prevDate) {
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / 86400000,
      );

      if (diffDays === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = currentDate;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalActiveDays,
  };
}

/**
 * Calculates overall KPIs
 */
export function calculateOverallStats(
  sessions: SessionRecord[],
  todos: TodoItem[],
): OverallStats {
  let totalFocusMinutes = 0;
  let totalCycles = 0;
  let targetCyclesTotal = 0;
  let longestSessionMinutes = 0;
  let totalOvertimeMinutes = 0;

  sessions.forEach((s) => {
    const focusMins = Number(s.focusMinutes) || 0;
    const otMins = Number(s.overtimeMinutes) || 0;
    const totalMins = focusMins + otMins;

    totalFocusMinutes += totalMins;
    totalCycles += Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;
    targetCyclesTotal += Number(s.targetCycles ?? s.targetSprints) || 0;
    totalOvertimeMinutes += otMins;

    if (totalMins > longestSessionMinutes) {
      longestSessionMinutes = totalMins;
    }
  });

  const totalSessions = sessions.length;
  const avgSessionMinutes =
    totalSessions > 0 ? Math.round(totalFocusMinutes / totalSessions) : 0;
  const cycleCompletionRate =
    targetCyclesTotal > 0
      ? Math.min(100, Math.round((totalCycles / targetCyclesTotal) * 100))
      : totalCycles > 0
        ? 100
        : 0;

  // Streaks
  const { currentStreak, bestStreak, totalActiveDays } = calculateStreaks(
    sessions,
    todos,
  );

  // Tasks metrics
  const tasksTotal = todos.length;
  const tasksCompleted = todos.filter((t) => t.completed).length;
  const taskCompletionRate =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const tasksCompletedToday = todos.filter(
    (t) => t.completed && t.completedAt && t.completedAt >= startOfToday,
  ).length;

  // Peak period
  const timeOfDay = calculateTimeOfDayStats(sessions);
  const peak = timeOfDay.reduce(
    (max, curr) => (curr.minutes > max.minutes ? curr : max),
    timeOfDay[0],
  );
  const peakProductivePeriod =
    peak && peak.minutes > 0 ? `${peak.label} (${peak.timeRange})` : "Flexible";

  return {
    totalFocusMinutes,
    totalSessions,
    totalCycles,
    targetCyclesTotal,
    cycleCompletionRate,
    avgSessionMinutes,
    longestSessionMinutes,
    totalOvertimeMinutes,
    currentStreakDays: currentStreak,
    bestStreakDays: bestStreak,
    totalActiveDays,
    tasksTotal,
    tasksCompleted,
    taskCompletionRate,
    tasksCompletedToday,
    peakProductivePeriod,
  };
}

/**
 * Calculates focus trend series for charts (hourly when today/single-day, daily when multi-day)
 */
export function calculateFocusTrendChartData(
  sessions: SessionRecord[],
  todos: TodoItem[],
  range: TimeRangeFilter = "week",
  customRange?: CustomDateRange | null,
): DayActivity[] {
  const result: DayActivity[] = [];
  const now = new Date();

  const isSingleDay =
    range === "today" ||
    (range === "custom" &&
      customRange?.start &&
      customRange?.end &&
      customRange.start === customRange.end);

  // 1. HOURLY BREAKDOWN FOR SINGLE DAY / TODAY
  if (isSingleDay) {
    const targetDateStr =
      range === "custom" && customRange?.start
        ? customRange.start
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Bucket by hour (0 - 23)
    const hourMap = new Map<
      number,
      { minutes: number; cycles: number; count: number; tasks: number }
    >();

    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { minutes: 0, cycles: 0, count: 0, tasks: 0 });
    }

    sessions.forEach((s) => {
      const d = new Date(s.createdAt);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (dStr === targetDateStr) {
        const hour = d.getHours();
        const curr = hourMap.get(hour) || {
          minutes: 0,
          cycles: 0,
          count: 0,
          tasks: 0,
        };

        hourMap.set(hour, {
          minutes:
            curr.minutes +
            (Number(s.focusMinutes) || 0) +
            (Number(s.overtimeMinutes) || 0),
          cycles:
            curr.cycles +
            (Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0),
          count: curr.count + 1,
          tasks: curr.tasks,
        });
      }
    });

    todos.forEach((t) => {
      if (t.completed && t.completedAt) {
        const d = new Date(t.completedAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (dStr === targetDateStr) {
          const hour = d.getHours();
          const curr = hourMap.get(hour) || {
            minutes: 0,
            cycles: 0,
            count: 0,
            tasks: 0,
          };

          curr.tasks += 1;
          hourMap.set(hour, curr);
        }
      }
    });

    for (let h = 0; h < 24; h++) {
      const sData = hourMap.get(h) || {
        minutes: 0,
        cycles: 0,
        count: 0,
        tasks: 0,
      };
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h >= 12 ? "PM" : "AM";
      const shortLabel = `${displayHour}${h >= 12 ? "p" : "a"}`;
      const fullLabel = `${displayHour}:00 ${ampm} - ${displayHour}:59 ${ampm}`;

      const intensity =
        sData.minutes >= 45
          ? 4
          : sData.minutes >= 25
            ? 3
            : sData.minutes >= 10
              ? 2
              : sData.minutes > 0
                ? 1
                : 0;

      result.push({
        dateStr: `${targetDateStr}T${String(h).padStart(2, "0")}:00:00`,
        dayLabel: shortLabel,
        fullDateLabel: fullLabel,
        focusMinutes: sData.minutes,
        cycleCount: sData.cycles,
        sessionCount: sData.count,
        taskCompletedCount: sData.tasks,
        intensityLevel: intensity,
      });
    }

    return result;
  }

  // 2. DAILY BREAKDOWN FOR MULTI-DAY / RANGE
  const sessionMap = new Map<
    string,
    { minutes: number; cycles: number; count: number }
  >();
  const todoMap = new Map<string, number>();

  sessions.forEach((s) => {
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const curr = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };

    sessionMap.set(dateStr, {
      minutes:
        curr.minutes +
        (Number(s.focusMinutes) || 0) +
        (Number(s.overtimeMinutes) || 0),
      cycles:
        curr.cycles + (Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0),
      count: curr.count + 1,
    });
  });

  todos.forEach((t) => {
    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);
    }
  });

  if (range === "custom" && customRange?.start && customRange?.end) {
    const start = new Date(`${customRange.start}T00:00:00`);
    const end = new Date(`${customRange.end}T00:00:00`);
    const diffDays = Math.min(
      60,
      Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1),
    );

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start);

      d.setDate(d.getDate() + i);

      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
      const fullDateLabel = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      const sData = sessionMap.get(dateStr) || {
        minutes: 0,
        cycles: 0,
        count: 0,
      };
      const taskCount = todoMap.get(dateStr) || 0;
      const intensity =
        sData.minutes >= 120
          ? 4
          : sData.minutes >= 60
            ? 3
            : sData.minutes >= 25
              ? 2
              : sData.minutes > 0
                ? 1
                : 0;

      result.push({
        dateStr,
        dayLabel: dayName,
        fullDateLabel,
        focusMinutes: sData.minutes,
        cycleCount: sData.cycles,
        sessionCount: sData.count,
        taskCompletedCount: taskCount,
        intensityLevel: intensity,
      });
    }

    return result;
  }

  const daysCount = range === "month" ? 30 : range === "all" ? 14 : 7;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);

    d.setDate(d.getDate() - i);

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
    const fullDateLabel = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const sData = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };
    const taskCount = todoMap.get(dateStr) || 0;
    const intensity =
      sData.minutes >= 120
        ? 4
        : sData.minutes >= 60
          ? 3
          : sData.minutes >= 25
            ? 2
            : sData.minutes > 0
              ? 1
              : 0;

    result.push({
      dateStr,
      dayLabel: dayName,
      fullDateLabel,
      focusMinutes: sData.minutes,
      cycleCount: sData.cycles,
      sessionCount: sData.count,
      taskCompletedCount: taskCount,
      intensityLevel: intensity,
    });
  }

  return result;
}

export const calculateDailyChartData = calculateFocusTrendChartData;

/**
 * Calculates activity heatmap matrix adapted to the specified date range filter
 */
export function calculateHeatmapData(
  sessions: SessionRecord[],
  todos: TodoItem[],
  range: TimeRangeFilter = "all",
  customRange: CustomDateRange | null = null,
): {
  weeks: DayActivity[][];
  months: { label: string; weekIndex: number }[];
  rangeTitle: string;
} {
  const now = new Date();
  let baseEndDate = now;
  let weeksCount = 10;
  let rangeTitle = "10-Week Focus Matrix";

  if (range === "today") {
    weeksCount = 2;
    rangeTitle = "Current Week Context (14-Day View)";
  } else if (range === "week") {
    weeksCount = 2;
    rangeTitle = "2-Week Focus Matrix";
  } else if (range === "month") {
    weeksCount = 5;
    rangeTitle = "5-Week Focus Matrix";
  } else if (range === "custom" && customRange?.start && customRange?.end) {
    try {
      const s = new Date(`${customRange.start}T00:00:00`);
      const e = new Date(`${customRange.end}T23:59:59`);

      baseEndDate = e;
      const daysDiff = Math.max(
        1,
        Math.round((e.getTime() - s.getTime()) / 86400000) + 1,
      );

      weeksCount = Math.min(12, Math.max(2, Math.ceil(daysDiff / 7)));
      rangeTitle = `${customRange.start} to ${customRange.end}`;
    } catch {
      weeksCount = 6;
      rangeTitle = "Custom Range Matrix";
    }
  }

  const totalDays = weeksCount * 7;
  const dayOfWeek = baseEndDate.getDay(); // 0 is Sunday, 6 is Saturday
  const daysToEndOfWeek = 6 - dayOfWeek;

  const endDate = new Date(baseEndDate);

  endDate.setDate(endDate.getDate() + daysToEndOfWeek);

  const sessionMap = new Map<
    string,
    { minutes: number; cycles: number; count: number }
  >();
  const todoMap = new Map<string, number>();

  sessions.forEach((s) => {
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const curr = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };

    sessionMap.set(dateStr, {
      minutes:
        curr.minutes +
        (Number(s.focusMinutes) || 0) +
        (Number(s.overtimeMinutes) || 0),
      cycles:
        curr.cycles + (Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0),
      count: curr.count + 1,
    });
  });

  todos.forEach((t) => {
    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);
    }
  });

  const allDays: DayActivity[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endDate);

    d.setDate(d.getDate() - i);

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
    const fullDateLabel = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const sData = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };
    const taskCount = todoMap.get(dateStr) || 0;

    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;

    if (sData.minutes >= 120) intensityLevel = 4;
    else if (sData.minutes >= 60) intensityLevel = 3;
    else if (sData.minutes >= 25) intensityLevel = 2;
    else if (sData.minutes > 0 || taskCount > 0) intensityLevel = 1;

    allDays.push({
      dateStr,
      dayLabel: dayName,
      fullDateLabel,
      focusMinutes: sData.minutes,
      cycleCount: sData.cycles,
      sessionCount: sData.count,
      taskCompletedCount: taskCount,
      intensityLevel,
    });
  }

  // Chunk into columns of 7 days (Sunday - Saturday)
  const weeks: DayActivity[][] = [];
  const months: { label: string; weekIndex: number }[] = [];
  let lastMonth = "";

  for (let w = 0; w < weeksCount; w++) {
    const weekDays = allDays.slice(w * 7, (w + 1) * 7);

    weeks.push(weekDays);

    // Track month label on the first day of each week
    if (weekDays.length > 0) {
      const firstDayDate = new Date(weekDays[0].dateStr);
      const monthLabel = firstDayDate.toLocaleDateString(undefined, {
        month: "short",
      });

      if (monthLabel !== lastMonth) {
        months.push({ label: monthLabel, weekIndex: w });
        lastMonth = monthLabel;
      }
    }
  }

  return { weeks, months, rangeTitle };
}

/**
 * Calculates Time of Day distribution
 */
export function calculateTimeOfDayStats(
  sessions: SessionRecord[],
): TimeOfDayStat[] {
  const buckets = {
    morning: { minutes: 0, count: 0 }, // 06:00 - 12:00
    afternoon: { minutes: 0, count: 0 }, // 12:00 - 18:00
    evening: { minutes: 0, count: 0 }, // 18:00 - 24:00
    night: { minutes: 0, count: 0 }, // 00:00 - 06:00
  };

  let totalMinutes = 0;

  sessions.forEach((s) => {
    const date = new Date(s.createdAt);
    const hour = date.getHours();
    const mins =
      (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);

    totalMinutes += mins;

    if (hour >= 6 && hour < 12) {
      buckets.morning.minutes += mins;
      buckets.morning.count += 1;
    } else if (hour >= 12 && hour < 18) {
      buckets.afternoon.minutes += mins;
      buckets.afternoon.count += 1;
    } else if (hour >= 18 && hour < 24) {
      buckets.evening.minutes += mins;
      buckets.evening.count += 1;
    } else {
      buckets.night.minutes += mins;
      buckets.night.count += 1;
    }
  });

  return [
    {
      period: "morning",
      label: "Morning",
      timeRange: "6:00 AM - 12:00 PM",
      minutes: buckets.morning.minutes,
      sessionsCount: buckets.morning.count,
      percentage:
        totalMinutes > 0
          ? Math.round((buckets.morning.minutes / totalMinutes) * 100)
          : 0,
      iconName: "sunrise",
    },
    {
      period: "afternoon",
      label: "Afternoon",
      timeRange: "12:00 PM - 6:00 PM",
      minutes: buckets.afternoon.minutes,
      sessionsCount: buckets.afternoon.count,
      percentage:
        totalMinutes > 0
          ? Math.round((buckets.afternoon.minutes / totalMinutes) * 100)
          : 0,
      iconName: "sun",
    },
    {
      period: "evening",
      label: "Evening",
      timeRange: "6:00 PM - 12:00 AM",
      minutes: buckets.evening.minutes,
      sessionsCount: buckets.evening.count,
      percentage:
        totalMinutes > 0
          ? Math.round((buckets.evening.minutes / totalMinutes) * 100)
          : 0,
      iconName: "sunset",
    },
    {
      period: "night",
      label: "Night",
      timeRange: "12:00 AM - 6:00 AM",
      minutes: buckets.night.minutes,
      sessionsCount: buckets.night.count,
      percentage:
        totalMinutes > 0
          ? Math.round((buckets.night.minutes / totalMinutes) * 100)
          : 0,
      iconName: "moon",
    },
  ];
}

/**
 * Calculates Category / Tag distribution
 */
export function calculateTagStats(
  sessions: SessionRecord[],
  todos: TodoItem[],
): TagStat[] {
  const tagMap = new Map<
    string,
    {
      label: string;
      color: string;
      focusMinutes: number;
      taskCount: number;
      completedTaskCount: number;
    }
  >();

  // Initialize presets
  PRESET_TAGS.forEach((tag) => {
    tagMap.set(tag.id, {
      label: tag.label,
      color: tag.color,
      focusMinutes: 0,
      taskCount: 0,
      completedTaskCount: 0,
    });
  });

  // Add General / Uncategorized bucket
  tagMap.set("general", {
    label: "General Focus",
    color: "text-muted bg-surface-secondary/50 border-separator/40",
    focusMinutes: 0,
    taskCount: 0,
    completedTaskCount: 0,
  });

  // Match sessions to tags by keyword in title or notes
  sessions.forEach((s) => {
    const mins =
      (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);
    const text = `${s.title} ${s.notes || ""}`.toLowerCase();

    let matched = false;

    for (const tag of PRESET_TAGS) {
      if (text.includes(tag.id) || text.includes(tag.label.toLowerCase())) {
        const item = tagMap.get(tag.id)!;

        item.focusMinutes += mins;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const item = tagMap.get("general")!;

      item.focusMinutes += mins;
    }
  });

  // Calculate task counts by tag
  let totalTasks = 0;

  todos.forEach((t) => {
    totalTasks += 1;
    const tagId = t.tag || "general";
    const item = tagMap.get(tagId);

    if (item) {
      item.taskCount += 1;
      if (t.completed) {
        item.completedTaskCount += 1;
      }
    } else {
      // Dynamic custom tag if any
      tagMap.set(tagId, {
        label: tagId.charAt(0).toUpperCase() + tagId.slice(1),
        color: "text-accent bg-accent/10 border-accent/30",
        focusMinutes: 0,
        taskCount: 1,
        completedTaskCount: t.completed ? 1 : 0,
      });
    }
  });

  const totalFocus = Array.from(tagMap.values()).reduce(
    (acc, curr) => acc + curr.focusMinutes,
    0,
  );

  return Array.from(tagMap.entries())
    .map(([id, val]) => ({
      id,
      label: val.label,
      color: val.color,
      focusMinutes: val.focusMinutes,
      taskCount: val.taskCount,
      completedTaskCount: val.completedTaskCount,
      percentage:
        totalFocus > 0
          ? Math.round((val.focusMinutes / totalFocus) * 100)
          : totalTasks > 0
            ? Math.round((val.taskCount / totalTasks) * 100)
            : 0,
    }))
    .filter((t) => t.focusMinutes > 0 || t.taskCount > 0);
}

/**
 * Calculates priority distribution for tasks
 */
export function calculatePriorityStats(todos: TodoItem[]): PriorityStat[] {
  const priorities: ("high" | "medium" | "low" | "none")[] = [
    "high",
    "medium",
    "low",
    "none",
  ];

  return priorities.map((p) => {
    const matching = todos.filter((t) => (t.priority || "none") === p);
    const total = matching.length;
    const completed = matching.filter((t) => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const config = PRIORITY_CONFIG[p];

    return {
      id: p,
      label: config.label,
      color: config.color,
      dotColor: config.dotColor,
      total,
      completed,
      percentage,
    };
  });
}

/**
 * Evaluates unlockable milestones & achievements
 */
export function calculateMilestones(
  sessions: SessionRecord[],
  todos: TodoItem[],
  overall: OverallStats,
): Milestone[] {
  // Time of day checks
  const hasEarlyMorningSession = sessions.some((s) => {
    const h = new Date(s.createdAt).getHours();

    return h >= 5 && h < 9;
  });

  const morningSessionsCount = sessions.filter((s) => {
    const h = new Date(s.createdAt).getHours();

    return h >= 5 && h < 12;
  }).length;

  const hasAfternoonSession =
    sessions.some((s) => {
      const h = new Date(s.createdAt).getHours();

      return h >= 12 && h < 17;
    }) || false;

  const hasLateNightSession = sessions.some((s) => {
    const h = new Date(s.createdAt).getHours();

    return h >= 22 || h < 4;
  });

  // Session quality checks
  const hasPerfectSession = sessions.some((s) => {
    const done = Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;
    const target = Number(s.targetCycles ?? s.targetSprints) || 0;

    return done >= target && target > 0;
  });

  const hasOvertime5 = sessions.some(
    (s) => (Number(s.overtimeMinutes) || 0) >= 5,
  );
  const hasOvertime15 = sessions.some(
    (s) => (Number(s.overtimeMinutes) || 0) >= 15,
  );
  const totalOvertimeMins = sessions.reduce(
    (acc, s) => acc + (Number(s.overtimeMinutes) || 0),
    0,
  );

  // Todo checks
  const completedTodos = todos.filter((t) => t.completed);
  const completedTags = new Set(
    completedTodos.map((t) => t.tag).filter(Boolean),
  );
  const completedHighPriority = completedTodos.filter(
    (t) => t.priority === "high",
  ).length;
  const completedWithNotes = completedTodos.filter((t) =>
    Boolean(t.notes && t.notes.trim().length > 0),
  ).length;
  const hasCleanSweep = todos.length >= 5 && todos.every((t) => t.completed);

  // Daily session counts
  const maxSessionsInSingleDay = (() => {
    const dayCounts = new Map<string, number>();

    sessions.forEach((s) => {
      const d = new Date(s.createdAt).toISOString().split("T")[0];

      dayCounts.set(d, (dayCounts.get(d) || 0) + 1);
    });

    let max = 0;

    dayCounts.forEach((count) => {
      if (count > max) max = count;
    });

    return max;
  })();

  const hasWeekendSession = (() => {
    const hadSat = sessions.some((s) => new Date(s.createdAt).getDay() === 6);
    const hadSun = sessions.some((s) => new Date(s.createdAt).getDay() === 0);

    return hadSat && hadSun;
  })();

  const milestones: Milestone[] = [
    // ==========================================
    // 1. FOCUS MASTERY & DURATION
    // ==========================================
    {
      id: "first_focus",
      title: "First Flow",
      description: "Complete your first pomodoro focus session",
      category: "focus",
      tier: "bronze",
      xp: 50,
      icon: Target,
      unlocked: overall.totalSessions >= 1,
      progress: Math.min(1, overall.totalSessions),
      maxProgress: 1,
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      borderHighlight:
        "border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    },
    {
      id: "focus_novice",
      title: "Getting in the Zone",
      description: "Complete 3 total pomodoro focus cycles",
      category: "focus",
      tier: "bronze",
      xp: 75,
      icon: Compass,
      unlocked: overall.totalCycles >= 3,
      progress: Math.min(3, overall.totalCycles),
      maxProgress: 3,
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      borderHighlight:
        "border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.3)]",
    },
    {
      id: "flow_starter",
      title: "Flow Apprentice",
      description: "Complete 10 total pomodoro cycles",
      category: "focus",
      tier: "bronze",
      xp: 150,
      icon: Zap,
      unlocked: overall.totalCycles >= 10,
      progress: Math.min(10, overall.totalCycles),
      maxProgress: 10,
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      borderHighlight:
        "border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]",
    },
    {
      id: "century_club",
      title: "Century Club",
      description: "Accumulate 100+ total focus minutes",
      category: "focus",
      tier: "bronze",
      xp: 150,
      icon: Clock,
      unlocked: overall.totalFocusMinutes >= 100,
      progress: Math.min(100, overall.totalFocusMinutes),
      maxProgress: 100,
      badgeColor: "text-accent bg-accent/10 border-accent/30",
      borderHighlight:
        "border-accent/80 shadow-[0_0_12px_rgba(234,179,8,0.35)]",
    },
    {
      id: "focus_adept",
      title: "Deep Work Adept",
      description: "Complete 25 total pomodoro focus cycles",
      category: "focus",
      tier: "silver",
      xp: 300,
      icon: Shield,
      unlocked: overall.totalCycles >= 25,
      progress: Math.min(25, overall.totalCycles),
      maxProgress: 25,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      borderHighlight:
        "border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.3)]",
    },
    {
      id: "deep_session_45",
      title: "Deep Immersion",
      description: "Complete an uninterrupted 45+ minute single session",
      category: "focus",
      tier: "silver",
      xp: 250,
      icon: Compass,
      unlocked: overall.longestSessionMinutes >= 45,
      progress: Math.min(45, overall.longestSessionMinutes),
      maxProgress: 45,
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
      borderHighlight:
        "border-indigo-400/80 shadow-[0_0_12px_rgba(129,140,248,0.3)]",
    },
    {
      id: "deep_session_60",
      title: "Hour of Power",
      description: "Complete a 60+ minute single focus session",
      category: "focus",
      tier: "silver",
      xp: 350,
      icon: Flame,
      unlocked: overall.longestSessionMinutes >= 60,
      progress: Math.min(60, overall.longestSessionMinutes),
      maxProgress: 60,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]",
    },
    {
      id: "deep_session_90",
      title: "Iron Focus",
      description: "Complete a 90+ minute marathon session",
      category: "focus",
      tier: "gold",
      xp: 500,
      icon: Award,
      unlocked: overall.longestSessionMinutes >= 90,
      progress: Math.min(90, overall.longestSessionMinutes),
      maxProgress: 90,
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      borderHighlight:
        "border-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.35)]",
    },
    {
      id: "half_day_focus",
      title: "Focus Dynamo",
      description: "Accumulate 300 total focus minutes (5 hours)",
      category: "focus",
      tier: "silver",
      xp: 400,
      icon: Zap,
      unlocked: overall.totalFocusMinutes >= 300,
      progress: Math.min(300, overall.totalFocusMinutes),
      maxProgress: 300,
      badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/30",
      borderHighlight:
        "border-violet-400/80 shadow-[0_0_12px_rgba(167,139,250,0.3)]",
    },
    {
      id: "workday_master",
      title: "Full Shift",
      description: "Accumulate 480 total focus minutes (8 full hours)",
      category: "focus",
      tier: "gold",
      xp: 600,
      icon: Clock,
      unlocked: overall.totalFocusMinutes >= 480,
      progress: Math.min(480, overall.totalFocusMinutes),
      maxProgress: 480,
      badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      borderHighlight:
        "border-teal-400/80 shadow-[0_0_14px_rgba(45,212,191,0.35)]",
    },
    {
      id: "marathon_runner",
      title: "Marathon Legend",
      description: "Complete 50 total pomodoro focus cycles",
      category: "focus",
      tier: "gold",
      xp: 800,
      icon: Award,
      unlocked: overall.totalCycles >= 50,
      progress: Math.min(50, overall.totalCycles),
      maxProgress: 50,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.35)]",
    },
    {
      id: "kilo_focus",
      title: "Kilo-Minute",
      description: "Accumulate 1,000 total minutes of deep focus",
      category: "focus",
      tier: "platinum",
      xp: 1200,
      icon: Crown,
      unlocked: overall.totalFocusMinutes >= 1000,
      progress: Math.min(1000, overall.totalFocusMinutes),
      maxProgress: 1000,
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      borderHighlight:
        "border-rose-500/90 shadow-[0_0_16px_rgba(244,63,94,0.4)]",
    },
    {
      id: "grand_centurion",
      title: "Grand Centurion",
      description: "Complete 100 total pomodoro cycles",
      category: "focus",
      tier: "diamond",
      xp: 2000,
      icon: Trophy,
      unlocked: overall.totalCycles >= 100,
      progress: Math.min(100, overall.totalCycles),
      maxProgress: 100,
      badgeColor: "text-amber-300 bg-amber-400/10 border-amber-400/40",
      borderHighlight:
        "border-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.45)]",
    },

    // ==========================================
    // 2. RHYTHM, CONSISTENCY & STREAKS
    // ==========================================
    {
      id: "first_streak",
      title: "First Spark",
      description: "Log focus sessions 2 days in a row",
      category: "consistency",
      tier: "bronze",
      xp: 75,
      icon: Flame,
      unlocked: overall.bestStreakDays >= 2,
      progress: Math.min(2, overall.bestStreakDays),
      maxProgress: 2,
      badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
      borderHighlight:
        "border-orange-400/80 shadow-[0_0_12px_rgba(251,146,60,0.3)]",
    },
    {
      id: "streak_3",
      title: "Ignition",
      description: "Maintain a 3-day consecutive focus streak",
      category: "consistency",
      tier: "bronze",
      xp: 150,
      icon: Flame,
      unlocked: overall.bestStreakDays >= 3,
      progress: Math.min(3, overall.bestStreakDays),
      maxProgress: 3,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]",
    },
    {
      id: "streak_5",
      title: "Workweek Warrior",
      description: "Maintain a 5-day consecutive focus streak",
      category: "consistency",
      tier: "silver",
      xp: 250,
      icon: Flame,
      unlocked: overall.bestStreakDays >= 5,
      progress: Math.min(5, overall.bestStreakDays),
      maxProgress: 5,
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      borderHighlight:
        "border-rose-400/80 shadow-[0_0_12px_rgba(251,113,133,0.3)]",
    },
    {
      id: "week_of_fire",
      title: "Week of Fire",
      description: "Maintain a full 7-day consecutive focus streak",
      category: "consistency",
      tier: "silver",
      xp: 400,
      icon: Flame,
      unlocked: overall.bestStreakDays >= 7,
      progress: Math.min(7, overall.bestStreakDays),
      maxProgress: 7,
      badgeColor: "text-red-400 bg-red-500/10 border-red-500/30",
      borderHighlight:
        "border-red-500/80 shadow-[0_0_14px_rgba(239,68,68,0.35)]",
    },
    {
      id: "streak_10",
      title: "Tenacious Ten",
      description: "Maintain a 10-day consecutive focus streak",
      category: "consistency",
      tier: "silver",
      xp: 500,
      icon: Shield,
      unlocked: overall.bestStreakDays >= 10,
      progress: Math.min(10, overall.bestStreakDays),
      maxProgress: 10,
      badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/30",
      borderHighlight:
        "border-violet-400/80 shadow-[0_0_14px_rgba(167,139,250,0.35)]",
    },
    {
      id: "streak_14",
      title: "Fortnight of Flow",
      description: "Achieve a monumental 14-day streak",
      category: "consistency",
      tier: "gold",
      xp: 800,
      icon: Rocket,
      unlocked: overall.bestStreakDays >= 14,
      progress: Math.min(14, overall.bestStreakDays),
      maxProgress: 14,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      borderHighlight:
        "border-emerald-400/80 shadow-[0_0_14px_rgba(52,211,153,0.35)]",
    },
    {
      id: "streak_21",
      title: "Habit Formed",
      description: "Reach a 21-day consecutive productivity streak",
      category: "consistency",
      tier: "gold",
      xp: 1200,
      icon: Crown,
      unlocked: overall.bestStreakDays >= 21,
      progress: Math.min(21, overall.bestStreakDays),
      maxProgress: 21,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.4)]",
    },
    {
      id: "streak_30",
      title: "Monthly Phenomenon",
      description: "Maintain a flawless 30-day consecutive streak",
      category: "consistency",
      tier: "platinum",
      xp: 2000,
      icon: Trophy,
      unlocked: overall.bestStreakDays >= 30,
      progress: Math.min(30, overall.bestStreakDays),
      maxProgress: 30,
      badgeColor: "text-teal-300 bg-teal-400/10 border-teal-400/40",
      borderHighlight:
        "border-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.45)]",
    },
    {
      id: "early_bird",
      title: "Dawn Patrol",
      description: "Complete a focus session before 9:00 AM",
      category: "consistency",
      tier: "bronze",
      xp: 120,
      icon: Sun,
      unlocked: hasEarlyMorningSession,
      progress: hasEarlyMorningSession ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-amber-300 bg-amber-400/10 border-amber-400/30",
      borderHighlight:
        "border-amber-300/80 shadow-[0_0_12px_rgba(252,211,77,0.3)]",
    },
    {
      id: "morning_clarity",
      title: "Morning Clarity",
      description: "Log 2 or more focus sessions before 12:00 PM",
      category: "consistency",
      tier: "bronze",
      xp: 150,
      icon: Sun,
      unlocked: morningSessionsCount >= 2,
      progress: Math.min(2, morningSessionsCount),
      maxProgress: 2,
      badgeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      borderHighlight:
        "border-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.3)]",
    },
    {
      id: "afternoon_surge",
      title: "Afternoon Surge",
      description: "Complete a focus session during afternoon hours",
      category: "consistency",
      tier: "bronze",
      xp: 100,
      icon: Zap,
      unlocked: hasAfternoonSession,
      progress: hasAfternoonSession ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
      borderHighlight:
        "border-orange-400/80 shadow-[0_0_12px_rgba(251,146,60,0.3)]",
    },
    {
      id: "night_owl",
      title: "Midnight Oil",
      description: "Complete a focus session after 10:00 PM",
      category: "consistency",
      tier: "bronze",
      xp: 120,
      icon: Moon,
      unlocked: hasLateNightSession,
      progress: hasLateNightSession ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
      borderHighlight:
        "border-indigo-400/80 shadow-[0_0_12px_rgba(129,140,248,0.3)]",
    },
    {
      id: "weekend_warrior",
      title: "Weekend Hustle",
      description: "Log focus sessions on both Saturday and Sunday",
      category: "consistency",
      tier: "silver",
      xp: 250,
      icon: Coffee,
      unlocked: hasWeekendSession,
      progress: hasWeekendSession ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      borderHighlight:
        "border-teal-400/80 shadow-[0_0_12px_rgba(45,212,191,0.3)]",
    },
    {
      id: "double_down",
      title: "Double Down",
      description: "Log 2 or more focus sessions in a single day",
      category: "consistency",
      tier: "bronze",
      xp: 100,
      icon: Layers,
      unlocked: maxSessionsInSingleDay >= 2,
      progress: Math.min(2, maxSessionsInSingleDay),
      maxProgress: 2,
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      borderHighlight:
        "border-blue-400/80 shadow-[0_0_12px_rgba(96,165,250,0.3)]",
    },
    {
      id: "triple_threat",
      title: "Triple Threat",
      description: "Log 3 or more focus sessions in a single day",
      category: "consistency",
      tier: "silver",
      xp: 250,
      icon: Layers,
      unlocked: maxSessionsInSingleDay >= 3,
      progress: Math.min(3, maxSessionsInSingleDay),
      maxProgress: 3,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      borderHighlight:
        "border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.3)]",
    },
    {
      id: "quad_power",
      title: "Relentless Flow",
      description: "Log 4 or more focus sessions in a single day",
      category: "consistency",
      tier: "gold",
      xp: 450,
      icon: Flame,
      unlocked: maxSessionsInSingleDay >= 4,
      progress: Math.min(4, maxSessionsInSingleDay),
      maxProgress: 4,
      badgeColor: "text-red-400 bg-red-500/10 border-red-500/30",
      borderHighlight:
        "border-red-400/80 shadow-[0_0_14px_rgba(248,113,113,0.35)]",
    },

    // ==========================================
    // 3. TASKS & EXECUTION
    // ==========================================
    {
      id: "first_todo",
      title: "First Checkmark",
      description: "Mark your first to-do task as completed",
      category: "tasks",
      tier: "bronze",
      xp: 50,
      icon: CheckCircle2,
      unlocked: overall.tasksCompleted >= 1,
      progress: Math.min(1, overall.tasksCompleted),
      maxProgress: 1,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      borderHighlight:
        "border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    },
    {
      id: "task_starter_5",
      title: "Gaining Momentum",
      description: "Complete 5 to-do tasks",
      category: "tasks",
      tier: "bronze",
      xp: 100,
      icon: CheckCircle2,
      unlocked: overall.tasksCompleted >= 5,
      progress: Math.min(5, overall.tasksCompleted),
      maxProgress: 5,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      borderHighlight:
        "border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    },
    {
      id: "task_crusher_10",
      title: "Task Crusher",
      description: "Complete 10 to-do tasks",
      category: "tasks",
      tier: "bronze",
      xp: 150,
      icon: Medal,
      unlocked: overall.tasksCompleted >= 10,
      progress: Math.min(10, overall.tasksCompleted),
      maxProgress: 10,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      borderHighlight:
        "border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    },
    {
      id: "task_slayer_25",
      title: "Task Slayer",
      description: "Complete 25 to-do tasks",
      category: "tasks",
      tier: "silver",
      xp: 350,
      icon: Target,
      unlocked: overall.tasksCompleted >= 25,
      progress: Math.min(25, overall.tasksCompleted),
      maxProgress: 25,
      badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      borderHighlight:
        "border-teal-400/80 shadow-[0_0_12px_rgba(45,212,191,0.3)]",
    },
    {
      id: "task_machine_50",
      title: "Productivity Engine",
      description: "Complete 50 to-do tasks",
      category: "tasks",
      tier: "gold",
      xp: 700,
      icon: Trophy,
      unlocked: overall.tasksCompleted >= 50,
      progress: Math.min(50, overall.tasksCompleted),
      maxProgress: 50,
      badgeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      borderHighlight:
        "border-yellow-400/80 shadow-[0_0_14px_rgba(250,204,21,0.35)]",
    },
    {
      id: "task_centurion_100",
      title: "Task Centurion",
      description: "Complete 100 to-do tasks",
      category: "tasks",
      tier: "platinum",
      xp: 1500,
      icon: Crown,
      unlocked: overall.tasksCompleted >= 100,
      progress: Math.min(100, overall.tasksCompleted),
      maxProgress: 100,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.4)]",
    },
    {
      id: "priority_first",
      title: "High Stakes",
      description: "Complete your first High-Priority task",
      category: "tasks",
      tier: "bronze",
      xp: 75,
      icon: Flag,
      unlocked: completedHighPriority >= 1,
      progress: Math.min(1, completedHighPriority),
      maxProgress: 1,
      badgeColor: "text-red-400 bg-red-500/10 border-red-500/30",
      borderHighlight:
        "border-red-400/80 shadow-[0_0_12px_rgba(248,113,113,0.3)]",
    },
    {
      id: "priority_pilot_5",
      title: "Priority Ace",
      description: "Finish 5 High-Priority tasks",
      category: "tasks",
      tier: "silver",
      xp: 250,
      icon: Star,
      unlocked: completedHighPriority >= 5,
      progress: Math.min(5, completedHighPriority),
      maxProgress: 5,
      badgeColor: "text-red-400 bg-red-500/10 border-red-500/30",
      borderHighlight:
        "border-red-400/80 shadow-[0_0_12px_rgba(248,113,113,0.3)]",
    },
    {
      id: "priority_master_15",
      title: "Mission Commander",
      description: "Finish 15 High-Priority tasks",
      category: "tasks",
      tier: "gold",
      xp: 600,
      icon: Shield,
      unlocked: completedHighPriority >= 15,
      progress: Math.min(15, completedHighPriority),
      maxProgress: 15,
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      borderHighlight:
        "border-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.35)]",
    },
    {
      id: "tag_polymath_3",
      title: "Balanced Mind",
      description: "Complete tasks across 3 different category tags",
      category: "tasks",
      tier: "silver",
      xp: 300,
      icon: Layers,
      unlocked: completedTags.size >= 3,
      progress: Math.min(3, completedTags.size),
      maxProgress: 3,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      borderHighlight:
        "border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.3)]",
    },
    {
      id: "tag_master_5",
      title: "Multi-Disciplinary",
      description: "Complete tasks across 5 different category tags",
      category: "tasks",
      tier: "gold",
      xp: 500,
      icon: Layers,
      unlocked: completedTags.size >= 5,
      progress: Math.min(5, completedTags.size),
      maxProgress: 5,
      badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/30",
      borderHighlight:
        "border-violet-400/80 shadow-[0_0_14px_rgba(167,139,250,0.35)]",
    },
    {
      id: "clean_sweep",
      title: "Clean Slate",
      description: "Have zero pending tasks with at least 5 completed",
      category: "tasks",
      tier: "silver",
      xp: 300,
      icon: CheckCircle2,
      unlocked: hasCleanSweep,
      progress: hasCleanSweep ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      borderHighlight:
        "border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    },
    {
      id: "note_taker",
      title: "Diligent Notes",
      description: "Complete 3 tasks that have detailed notes attached",
      category: "tasks",
      tier: "bronze",
      xp: 100,
      icon: Bookmark,
      unlocked: completedWithNotes >= 3,
      progress: Math.min(3, completedWithNotes),
      maxProgress: 3,
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      borderHighlight:
        "border-blue-400/80 shadow-[0_0_12px_rgba(96,165,250,0.3)]",
    },

    // ==========================================
    // 4. MASTERY & SPECIAL FEATS
    // ==========================================
    {
      id: "flawless_target",
      title: "Flawless Target",
      description: "Hit 100% of your cycle goals in a multi-cycle session",
      category: "mastery",
      tier: "silver",
      xp: 250,
      icon: Target,
      unlocked: hasPerfectSession,
      progress: hasPerfectSession ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
      borderHighlight:
        "border-teal-400/80 shadow-[0_0_12px_rgba(45,212,191,0.3)]",
    },
    {
      id: "overdrive_5",
      title: "Bonus Drive",
      description: "Log 5+ minutes of bonus overtime focus",
      category: "mastery",
      tier: "bronze",
      xp: 100,
      icon: Zap,
      unlocked: hasOvertime5,
      progress: hasOvertime5 ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/30",
      borderHighlight:
        "border-orange-400/80 shadow-[0_0_12px_rgba(251,146,60,0.3)]",
    },
    {
      id: "overdrive_15",
      title: "Overdrive",
      description: "Log 15+ minutes of overtime in a single session",
      category: "mastery",
      tier: "silver",
      xp: 250,
      icon: Flame,
      unlocked: hasOvertime15,
      progress: hasOvertime15 ? 1 : 0,
      maxProgress: 1,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]",
    },
    {
      id: "overtime_total_60",
      title: "Overtime Virtuoso",
      description: "Accumulate 60+ total minutes in overtime work",
      category: "mastery",
      tier: "gold",
      xp: 500,
      icon: Award,
      unlocked: totalOvertimeMins >= 60,
      progress: Math.min(60, totalOvertimeMins),
      maxProgress: 60,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      borderHighlight:
        "border-purple-400/80 shadow-[0_0_14px_rgba(192,132,252,0.35)]",
    },
    {
      id: "trophy_hunter_10",
      title: "Trophy Hunter",
      description: "Unlock 10 achievements across your journey",
      category: "mastery",
      tier: "bronze",
      xp: 200,
      icon: Trophy,
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      borderHighlight:
        "border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.3)]",
    },
    {
      id: "trophy_hunter_20",
      title: "Master Collector",
      description: "Unlock 20 achievements across your journey",
      category: "mastery",
      tier: "silver",
      xp: 500,
      icon: Trophy,
      unlocked: false,
      progress: 0,
      maxProgress: 20,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      borderHighlight:
        "border-purple-400/80 shadow-[0_0_14px_rgba(192,132,252,0.35)]",
    },
    {
      id: "trophy_hunter_30",
      title: "Grand Laureate",
      description: "Unlock 30 achievements across your journey",
      category: "mastery",
      tier: "gold",
      xp: 1000,
      icon: Crown,
      unlocked: false,
      progress: 0,
      maxProgress: 30,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      borderHighlight:
        "border-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.4)]",
    },
    {
      id: "cozy_legend",
      title: "Cozify Deity",
      description: "Unlock 40 achievements across your journey",
      category: "mastery",
      tier: "diamond",
      xp: 3000,
      icon: Trophy,
      unlocked: false,
      progress: 0,
      maxProgress: 40,
      badgeColor: "text-amber-300 bg-amber-400/10 border-amber-400/40",
      borderHighlight:
        "border-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.5)]",
    },
  ];

  // Dynamically calculate the meta-achievement progress
  const unlockedBaseCount = milestones.filter(
    (m) =>
      !m.id.startsWith("trophy_hunter_") &&
      m.id !== "cozy_legend" &&
      m.unlocked,
  ).length;

  const th10 = milestones.find((m) => m.id === "trophy_hunter_10");

  if (th10) {
    th10.progress = Math.min(10, unlockedBaseCount);
    th10.unlocked = unlockedBaseCount >= 10;
  }

  const th20 = milestones.find((m) => m.id === "trophy_hunter_20");

  if (th20) {
    th20.progress = Math.min(20, unlockedBaseCount);
    th20.unlocked = unlockedBaseCount >= 20;
  }

  const th30 = milestones.find((m) => m.id === "trophy_hunter_30");

  if (th30) {
    th30.progress = Math.min(30, unlockedBaseCount);
    th30.unlocked = unlockedBaseCount >= 30;
  }

  const cl = milestones.find((m) => m.id === "cozy_legend");

  if (cl) {
    const totalUnlockedAll = milestones.filter(
      (m) => m.id !== "cozy_legend" && m.unlocked,
    ).length;

    cl.progress = Math.min(40, totalUnlockedAll);
    cl.unlocked = totalUnlockedAll >= 40;
  }

  return milestones;
}
