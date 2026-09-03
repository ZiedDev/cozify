import { ACHIEVEMENT_DEFINITIONS, AchievementMetrics } from "../achievements";
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
import { TodoItem, PRESET_TAGS, PRIORITY_CONFIG } from "@/menus/todo/types";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

  // Fast string key extraction from sessions
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    activeDateSet.add(dateStr);
  }

  // Fast string key extraction from completed todos
  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];

    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      activeDateSet.add(dateStr);
    }
  }

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
  let prevDateTs: number | null = null;

  for (let i = 0; i < sortedDates.length; i++) {
    const [y, m, d] = sortedDates[i].split("-").map(Number);
    const currentTs = new Date(y, m - 1, d).getTime();

    if (prevDateTs !== null) {
      const diffDays = Math.round((currentTs - prevDateTs) / 86400000);

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
    prevDateTs = currentTs;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalActiveDays,
  };
}

/**
 * Calculates overall KPIs in a single optimized pass
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

  const timeBuckets = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
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

    const h = new Date(s.createdAt).getHours();

    if (h >= 6 && h < 12) {
      timeBuckets.morning += totalMins;
    } else if (h >= 12 && h < 18) {
      timeBuckets.afternoon += totalMins;
    } else if (h >= 18 && h < 24) {
      timeBuckets.evening += totalMins;
    } else {
      timeBuckets.night += totalMins;
    }
  }

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
  let tasksCompleted = 0;
  let tasksCompletedToday = 0;
  const tasksTotal = todos.length;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];

    if (t.completed) {
      tasksCompleted++;
      if (t.completedAt && t.completedAt >= startOfToday) {
        tasksCompletedToday++;
      }
    }
  }

  const taskCompletionRate =
    tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  // Peak period calculation
  let peakProductivePeriod = "Flexible";
  let maxPeriodMins = 0;
  const periodCandidates = [
    { label: "Morning (6:00 AM - 12:00 PM)", mins: timeBuckets.morning },
    { label: "Afternoon (12:00 PM - 6:00 PM)", mins: timeBuckets.afternoon },
    { label: "Evening (6:00 PM - 12:00 AM)", mins: timeBuckets.evening },
    { label: "Night (12:00 AM - 6:00 AM)", mins: timeBuckets.night },
  ];

  for (let i = 0; i < periodCandidates.length; i++) {
    if (periodCandidates[i].mins > maxPeriodMins) {
      maxPeriodMins = periodCandidates[i].mins;
      peakProductivePeriod = periodCandidates[i].label;
    }
  }

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

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const d = new Date(s.createdAt);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (dStr === targetDateStr) {
        const hour = d.getHours();
        const curr = hourMap.get(hour)!;

        curr.minutes +=
          (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);
        curr.cycles += Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;
        curr.count += 1;
      }
    }

    for (let i = 0; i < todos.length; i++) {
      const t = todos[i];

      if (t.completed && t.completedAt) {
        const d = new Date(t.completedAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (dStr === targetDateStr) {
          const hour = d.getHours();
          const curr = hourMap.get(hour)!;

          curr.tasks += 1;
        }
      }
    }

    for (let h = 0; h < 24; h++) {
      const sData = hourMap.get(h)!;
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h >= 12 ? "PM" : "AM";
      const shortLabel = `${displayHour} ${ampm}`;
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
        periodType: "hourly",
        dateRange: { start: targetDateStr, end: targetDateStr },
      });
    }

    return result;
  }

  // 2. MULTI-DAY / EXTENDED RANGE BREAKDOWN
  const sessionMap = new Map<
    string,
    { minutes: number; cycles: number; count: number }
  >();
  const todoMap = new Map<string, number>();

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const curr = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };

    curr.minutes +=
      (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);
    curr.cycles += Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;
    curr.count += 1;
    sessionMap.set(dateStr, curr);
  }

  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];

    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);
    }
  }

  let startDate: Date;
  let endDate: Date;

  if (range === "custom" && customRange?.start && customRange?.end) {
    startDate = new Date(`${customRange.start}T00:00:00`);
    endDate = new Date(`${customRange.end}T00:00:00`);
  } else if (range === "all") {
    let earliestTs = now.getTime() - 29 * 86400000;

    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].createdAt && sessions[i].createdAt < earliestTs) {
        earliestTs = sessions[i].createdAt;
      }
    }
    for (let i = 0; i < todos.length; i++) {
      const ts = todos[i].completedAt || todos[i].createdAt;

      if (ts && ts < earliestTs) {
        earliestTs = ts;
      }
    }
    startDate = new Date(earliestTs);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);
  } else {
    // 7 days default
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);
  }

  const diffDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1,
  );

  // A. DAILY BREAKDOWN (<= 31 days)
  if (diffDays <= 31) {
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate);

      d.setDate(d.getDate() + i);

      const y = d.getFullYear();
      const m = d.getMonth();
      const dNum = d.getDate();
      const dayOfWeek = d.getDay();
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      const dayName =
        diffDays <= 10 || range === "week"
          ? DAY_NAMES[dayOfWeek]
          : `${m + 1}/${dNum}`;
      const fullDateLabel = `${DAY_NAMES[dayOfWeek]}, ${MONTH_NAMES[m]} ${dNum}, ${y}`;

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
        totalPeriodMinutes: sData.minutes,
        cycleCount: sData.cycles,
        sessionCount: sData.count,
        taskCompletedCount: taskCount,
        intensityLevel: intensity,
        periodType: "daily",
        dateRange: { start: dateStr, end: dateStr },
      });
    }

    return result;
  }

  // B. WEEKLY GROUPING (32 to 120 days, ~1 to 4 months)
  if (diffDays <= 120) {
    let currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const currentWeekEnd = new Date(currentWeekStart);

      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      if (currentWeekEnd > endDate) {
        currentWeekEnd.setTime(endDate.getTime());
      }

      const daysInBucket = Math.max(
        1,
        Math.round(
          (currentWeekEnd.getTime() - currentWeekStart.getTime()) / 86400000,
        ) + 1,
      );

      let totalMinutes = 0;
      let totalCycles = 0;
      let totalSessions = 0;
      let totalTasks = 0;

      for (let dayOffset = 0; dayOffset < daysInBucket; dayOffset++) {
        const d = new Date(currentWeekStart);

        d.setDate(d.getDate() + dayOffset);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const sData = sessionMap.get(dateStr);

        if (sData) {
          totalMinutes += sData.minutes;
          totalCycles += sData.cycles;
          totalSessions += sData.count;
        }
        totalTasks += todoMap.get(dateStr) || 0;
      }

      const avgDailyMinutes = Math.round(totalMinutes / daysInBucket);
      const shortLabel = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()}`;
      const fullLabel = `Week of ${MONTH_NAMES[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} – ${MONTH_NAMES[currentWeekEnd.getMonth()]} ${currentWeekEnd.getDate()}`;

      const intensity =
        avgDailyMinutes >= 120
          ? 4
          : avgDailyMinutes >= 60
            ? 3
            : avgDailyMinutes >= 25
              ? 2
              : avgDailyMinutes > 0
                ? 1
                : 0;

      const wStartStr = `${currentWeekStart.getFullYear()}-${String(currentWeekStart.getMonth() + 1).padStart(2, "0")}-${String(currentWeekStart.getDate()).padStart(2, "0")}`;
      const wEndStr = `${currentWeekEnd.getFullYear()}-${String(currentWeekEnd.getMonth() + 1).padStart(2, "0")}-${String(currentWeekEnd.getDate()).padStart(2, "0")}`;

      result.push({
        dateStr: wStartStr,
        dayLabel: shortLabel,
        fullDateLabel: fullLabel,
        focusMinutes: avgDailyMinutes,
        totalPeriodMinutes: totalMinutes,
        cycleCount: totalCycles,
        sessionCount: totalSessions,
        taskCompletedCount: totalTasks,
        intensityLevel: intensity,
        periodType: "weekly",
        dateRange: { start: wStartStr, end: wEndStr },
      });

      // Advance by 7 days
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return result;
  }

  // C. MONTHLY GROUPING (> 120 days, ~4+ months to years)
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (currentMonth <= endMonth) {
    const mStart = new Date(
      Math.max(
        startDate.getTime(),
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        ).getTime(),
      ),
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const mEnd = new Date(
      Math.min(endDate.getTime(), lastDayOfMonth.getTime()),
    );

    const daysInBucket = Math.max(
      1,
      Math.round((mEnd.getTime() - mStart.getTime()) / 86400000) + 1,
    );

    let totalMinutes = 0;
    let totalCycles = 0;
    let totalSessions = 0;
    let totalTasks = 0;

    for (let dayOffset = 0; dayOffset < daysInBucket; dayOffset++) {
      const d = new Date(mStart);

      d.setDate(d.getDate() + dayOffset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const sData = sessionMap.get(dateStr);

      if (sData) {
        totalMinutes += sData.minutes;
        totalCycles += sData.cycles;
        totalSessions += sData.count;
      }
      totalTasks += todoMap.get(dateStr) || 0;
    }

    const avgDailyMinutes = Math.round(totalMinutes / daysInBucket);
    const mIdx = currentMonth.getMonth();
    const shortLabel = MONTH_NAMES[mIdx];
    const fullLabel = `${FULL_MONTH_NAMES[mIdx]} ${currentMonth.getFullYear()}`;

    const intensity =
      avgDailyMinutes >= 120
        ? 4
        : avgDailyMinutes >= 60
          ? 3
          : avgDailyMinutes >= 25
            ? 2
            : avgDailyMinutes > 0
              ? 1
              : 0;

    const mStartStr = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}-${String(mStart.getDate()).padStart(2, "0")}`;
    const mEndStr = `${mEnd.getFullYear()}-${String(mEnd.getMonth() + 1).padStart(2, "0")}-${String(mEnd.getDate()).padStart(2, "0")}`;

    result.push({
      dateStr: mStartStr,
      dayLabel: shortLabel,
      fullDateLabel: fullLabel,
      focusMinutes: avgDailyMinutes,
      totalPeriodMinutes: totalMinutes,
      cycleCount: totalCycles,
      sessionCount: totalSessions,
      taskCompletedCount: totalTasks,
      intensityLevel: intensity,
      periodType: "monthly",
      dateRange: { start: mStartStr, end: mEndStr },
    });

    // Advance to next month
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
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
  _range: TimeRangeFilter = "all",
  _customRange: CustomDateRange | null = null,
): {
  weeks: DayActivity[][];
  months: { label: string; weekIndex: number }[];
  rangeTitle: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  let earliestYear = currentYear;
  const rangeTitle = "Year-Round Consistency & Focus Momentum";

  const sessionMap = new Map<
    string,
    { minutes: number; cycles: number; count: number }
  >();
  const todoMap = new Map<string, number>();

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const mins =
      (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);
    const cycles = Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;
    const d = new Date(s.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const curr = sessionMap.get(dateStr) || {
      minutes: 0,
      cycles: 0,
      count: 0,
    };

    curr.minutes += mins;
    curr.cycles += cycles;
    curr.count += 1;
    sessionMap.set(dateStr, curr);

    if (mins > 0 || cycles > 0) {
      const yr = d.getFullYear();

      if (yr < earliestYear) {
        earliestYear = yr;
      }
    }
  }

  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];

    if (t.completed && t.completedAt) {
      const d = new Date(t.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);

      const yr = d.getFullYear();

      if (yr < earliestYear) {
        earliestYear = yr;
      }
    }
  }

  const startYear = Math.min(currentYear, earliestYear);

  const todayEndTimestamp = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

  const weeks: DayActivity[][] = [];
  const months: { label: string; weekIndex: number }[] = [];
  let lastMonth = "";

  // Generate each calendar year strictly in 52-week blocks (Weeks 0-25 = H1, Weeks 26-51 = H2)
  for (let year = startYear; year <= currentYear; year++) {
    const jan1 = new Date(year, 0, 1);
    const startSunday = new Date(jan1);

    startSunday.setDate(startSunday.getDate() - jan1.getDay());

    for (let w = 0; w < 52; w++) {
      const weekDays: DayActivity[] = [];

      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startSunday);

        dayDate.setDate(dayDate.getDate() + w * 7 + d);

        const isFuture = dayDate.getTime() > todayEndTimestamp;
        const y = dayDate.getFullYear();
        const m = dayDate.getMonth();
        const dNum = dayDate.getDate();
        const dayOfWeek = dayDate.getDay();
        const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
        const dayName = DAY_NAMES[dayOfWeek];
        const fullDateLabel = `${MONTH_NAMES[m]} ${dNum}, ${y}`;

        const sData = sessionMap.get(dateStr) || {
          minutes: 0,
          cycles: 0,
          count: 0,
        };
        const taskCount = todoMap.get(dateStr) || 0;

        let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;

        if (!isFuture) {
          if (sData.minutes >= 120) intensityLevel = 4;
          else if (sData.minutes >= 60) intensityLevel = 3;
          else if (sData.minutes >= 25) intensityLevel = 2;
          else if (sData.minutes > 0 || taskCount > 0) intensityLevel = 1;
        }

        weekDays.push({
          dateStr,
          dayLabel: dayName,
          fullDateLabel,
          focusMinutes: isFuture ? 0 : sData.minutes,
          cycleCount: isFuture ? 0 : sData.cycles,
          sessionCount: isFuture ? 0 : sData.count,
          taskCompletedCount: isFuture ? 0 : taskCount,
          intensityLevel,
          isFuture,
        });
      }

      const globalWeekIndex = weeks.length;

      weeks.push(weekDays);

      if (weekDays.length > 0) {
        const firstDayDate = new Date(weekDays[0].dateStr);
        const monthLabel = MONTH_NAMES[firstDayDate.getMonth()];

        if (monthLabel !== lastMonth) {
          months.push({ label: monthLabel, weekIndex: globalWeekIndex });
          lastMonth = monthLabel;
        }
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

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
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
  }

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

  // Match sessions to tags (explicit s.tag first, fallback to keyword matching)
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const mins =
      (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0);

    let matched = false;

    if (s.tag) {
      const existing = tagMap.get(s.tag);

      if (existing) {
        existing.focusMinutes += mins;
        matched = true;
      } else {
        tagMap.set(s.tag, {
          label: s.tag.charAt(0).toUpperCase() + s.tag.slice(1),
          color: "text-accent bg-accent/10 border-accent/30",
          focusMinutes: mins,
          taskCount: 0,
          completedTaskCount: 0,
        });
        matched = true;
      }
    } else {
      const text = `${s.title} ${s.notes || ""}`.toLowerCase();

      for (const tag of PRESET_TAGS) {
        if (text.includes(tag.id) || text.includes(tag.label.toLowerCase())) {
          const item = tagMap.get(tag.id)!;

          item.focusMinutes += mins;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const item = tagMap.get("general")!;

      item.focusMinutes += mins;
    }
  }

  // Calculate task counts by tag
  let totalTasks = 0;

  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];

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
  }

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
 * Calculates priority distribution for tasks in a single pass
 */
export function calculatePriorityStats(todos: TodoItem[]): PriorityStat[] {
  const counts: Record<
    "high" | "medium" | "low" | "none",
    { total: number; completed: number }
  > = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
    none: { total: 0, completed: 0 },
  };

  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];
    const p = t.priority || "none";

    if (counts[p]) {
      counts[p].total += 1;
      if (t.completed) counts[p].completed += 1;
    }
  }

  const priorities: ("high" | "medium" | "low" | "none")[] = [
    "high",
    "medium",
    "low",
    "none",
  ];

  return priorities.map((p) => {
    const { total, completed } = counts[p];
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
 * Evaluates unlockable milestones & achievements in a single pass
 */
export function calculateMilestones(
  sessions: SessionRecord[],
  todos: TodoItem[],
  overall: OverallStats,
): Milestone[] {
  // 1. Sort sessions chronologically (oldest to newest) to detect exact unlock time
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // 2. Sort completed todos chronologically
  const sortedCompletedTodos = todos
    .filter((t) => t.completed)
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.createdAt).getTime();
      const timeB = new Date(b.completedAt || b.createdAt).getTime();

      return timeA - timeB;
    });

  const isKonamiUnlocked = Boolean(
    typeof window !== "undefined" &&
      localStorage.getItem("cozify_konami_code") === "true",
  );

  const unlockTimes: Record<string, string> = {};

  let cumulativeCycles = 0;
  let cumulativeMinutes = 0;
  let cumulativeOvertime = 0;
  let hasEarlyMorningSession = false;
  let morningSessionsCount = 0;
  let hasAfternoonSession = false;
  let hasLateNightSession = false;
  let hasPerfectSession = false;
  let hasOvertime5 = false;
  let hasOvertime15 = false;
  let totalOvertimeMins = 0;
  let hadSat = false;
  let hadSun = false;
  const dayCounts = new Map<string, number>();

  for (let i = 0; i < sortedSessions.length; i++) {
    const s = sortedSessions[i];
    const sIso = new Date(s.createdAt).toISOString();
    const d = new Date(s.createdAt);
    const h = d.getHours();
    const day = d.getDay();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (i === 0 && !unlockTimes.first_focus) unlockTimes.first_focus = sIso;

    const cycles = Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0;

    cumulativeCycles += cycles;
    if (cumulativeCycles >= 3 && !unlockTimes.focus_novice)
      unlockTimes.focus_novice = sIso;
    if (cumulativeCycles >= 10 && !unlockTimes.flow_starter)
      unlockTimes.flow_starter = sIso;
    if (cumulativeCycles >= 25 && !unlockTimes.focus_adept)
      unlockTimes.focus_adept = sIso;
    if (cumulativeCycles >= 50 && !unlockTimes.marathon_runner)
      unlockTimes.marathon_runner = sIso;
    if (cumulativeCycles >= 100 && !unlockTimes.grand_centurion)
      unlockTimes.grand_centurion = sIso;

    const mins = Number(s.focusMinutes) || 0;

    cumulativeMinutes += mins;
    if (cumulativeMinutes >= 100 && !unlockTimes.century_club)
      unlockTimes.century_club = sIso;
    if (cumulativeMinutes >= 300 && !unlockTimes.half_day_focus)
      unlockTimes.half_day_focus = sIso;
    if (cumulativeMinutes >= 480 && !unlockTimes.workday_master)
      unlockTimes.workday_master = sIso;
    if (cumulativeMinutes >= 1000 && !unlockTimes.kilo_focus)
      unlockTimes.kilo_focus = sIso;

    if (mins >= 45 && !unlockTimes.deep_session_45)
      unlockTimes.deep_session_45 = sIso;
    if (mins >= 60 && !unlockTimes.deep_session_60)
      unlockTimes.deep_session_60 = sIso;
    if (mins >= 90 && !unlockTimes.deep_session_90)
      unlockTimes.deep_session_90 = sIso;

    if (h >= 5 && h < 9) {
      hasEarlyMorningSession = true;
      if (!unlockTimes.early_bird) unlockTimes.early_bird = sIso;
    }
    if (h >= 5 && h < 12) {
      morningSessionsCount++;
      if (morningSessionsCount >= 2 && !unlockTimes.morning_clarity)
        unlockTimes.morning_clarity = sIso;
    }
    if (h >= 12 && h < 17) {
      hasAfternoonSession = true;
      if (!unlockTimes.afternoon_surge) unlockTimes.afternoon_surge = sIso;
    }
    if (h >= 22 || h < 4) {
      hasLateNightSession = true;
      if (!unlockTimes.night_owl) unlockTimes.night_owl = sIso;
    }

    if (day === 6) hadSat = true;
    if (day === 0) hadSun = true;
    if (hadSat && hadSun && !unlockTimes.weekend_warrior) {
      unlockTimes.weekend_warrior = sIso;
    }

    const target = Number(s.targetCycles ?? s.targetSprints) || 0;

    if (cycles >= target && target > 0) {
      hasPerfectSession = true;
      if (!unlockTimes.flawless_target) unlockTimes.flawless_target = sIso;
    }

    const ot = Number(s.overtimeMinutes) || 0;

    if (ot >= 5) {
      hasOvertime5 = true;
      if (!unlockTimes.overdrive_5) unlockTimes.overdrive_5 = sIso;
    }
    if (ot >= 15) {
      hasOvertime15 = true;
      if (!unlockTimes.overdrive_15) unlockTimes.overdrive_15 = sIso;
    }
    totalOvertimeMins += ot;
    cumulativeOvertime += ot;
    if (cumulativeOvertime >= 60 && !unlockTimes.overtime_total_60) {
      unlockTimes.overtime_total_60 = sIso;
    }

    const currentDayCount = (dayCounts.get(dateStr) || 0) + 1;

    dayCounts.set(dateStr, currentDayCount);
    if (currentDayCount >= 2 && !unlockTimes.double_down)
      unlockTimes.double_down = sIso;
    if (currentDayCount >= 3 && !unlockTimes.triple_threat)
      unlockTimes.triple_threat = sIso;
    if (currentDayCount >= 4 && !unlockTimes.quad_power)
      unlockTimes.quad_power = sIso;
  }

  let maxSessionsInSingleDay = 0;

  for (const count of dayCounts.values()) {
    if (count > maxSessionsInSingleDay) maxSessionsInSingleDay = count;
  }
  const hasWeekendSession = hadSat && hadSun;

  const latestSessionDate =
    sortedSessions.length > 0
      ? new Date(
          sortedSessions[sortedSessions.length - 1].createdAt,
        ).toISOString()
      : new Date().toISOString();

  if (overall.bestStreakDays >= 2) unlockTimes.first_streak = latestSessionDate;
  if (overall.bestStreakDays >= 3) unlockTimes.streak_3 = latestSessionDate;
  if (overall.bestStreakDays >= 5) unlockTimes.streak_5 = latestSessionDate;
  if (overall.bestStreakDays >= 7) unlockTimes.week_of_fire = latestSessionDate;
  if (overall.bestStreakDays >= 10) unlockTimes.streak_10 = latestSessionDate;
  if (overall.bestStreakDays >= 14) unlockTimes.streak_14 = latestSessionDate;
  if (overall.bestStreakDays >= 21) unlockTimes.streak_21 = latestSessionDate;
  if (overall.bestStreakDays >= 30) unlockTimes.streak_30 = latestSessionDate;

  let completedHighPriority = 0;
  let completedWithNotes = 0;
  const completedTags = new Set<string>();

  for (let i = 0; i < sortedCompletedTodos.length; i++) {
    const t = sortedCompletedTodos[i];
    const rawTime = t.completedAt || t.createdAt;
    const taskTime = rawTime
      ? new Date(rawTime).toISOString()
      : new Date().toISOString();

    if (i === 0 && !unlockTimes.first_todo) unlockTimes.first_todo = taskTime;
    if (i + 1 >= 5 && !unlockTimes.task_starter_5)
      unlockTimes.task_starter_5 = taskTime;
    if (i + 1 >= 10 && !unlockTimes.task_crusher_10)
      unlockTimes.task_crusher_10 = taskTime;
    if (i + 1 >= 25 && !unlockTimes.task_slayer_25)
      unlockTimes.task_slayer_25 = taskTime;
    if (i + 1 >= 50 && !unlockTimes.task_machine_50)
      unlockTimes.task_machine_50 = taskTime;
    if (i + 1 >= 100 && !unlockTimes.task_centurion_100)
      unlockTimes.task_centurion_100 = taskTime;

    if (t.priority === "high") {
      completedHighPriority++;
      if (completedHighPriority >= 1 && !unlockTimes.priority_first)
        unlockTimes.priority_first = taskTime;
      if (completedHighPriority >= 5 && !unlockTimes.priority_pilot_5)
        unlockTimes.priority_pilot_5 = taskTime;
      if (completedHighPriority >= 15 && !unlockTimes.priority_master_15)
        unlockTimes.priority_master_15 = taskTime;
    }

    if (t.tag && !completedTags.has(t.tag)) {
      completedTags.add(t.tag);
      if (completedTags.size >= 3 && !unlockTimes.tag_polymath_3)
        unlockTimes.tag_polymath_3 = taskTime;
      if (completedTags.size >= 5 && !unlockTimes.tag_master_5)
        unlockTimes.tag_master_5 = taskTime;
    }

    if (t.notes && t.notes.trim().length > 0) {
      completedWithNotes++;
      if (completedWithNotes >= 3 && !unlockTimes.note_taker)
        unlockTimes.note_taker = taskTime;
    }
  }

  const metrics: AchievementMetrics = {
    totalSessions: overall.totalSessions,
    totalCycles: overall.totalCycles,
    totalFocusMinutes: overall.totalFocusMinutes,
    longestSessionMinutes: overall.longestSessionMinutes,
    currentStreakDays: overall.currentStreakDays,
    totalActiveDays: overall.totalActiveDays,
    morningSessionsCount,
    hasEarlyMorningSession,
    hasAfternoonSession,
    hasLateNightSession,
    hadSatAndSun: hasWeekendSession,
    maxDailySessions: maxSessionsInSingleDay,
    completedTodosCount: sortedCompletedTodos.length,
    completedHighPriority,
    completedTagsCount: completedTags.size,
    completedWithNotes,
    hasPerfectSession,
    hasOvertime5,
    hasOvertime15,
    totalOvertimeMins,
    isKonamiUnlocked,
  };

  const milestones: Milestone[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const rawVal = def.getValue(metrics);
    const progress = Math.min(def.maxProgress, rawVal);
    const unlocked = def.maxProgress > 0 ? progress >= def.maxProgress : false;
    const unlockedAt = unlocked
      ? unlockTimes[def.id] || latestSessionDate
      : undefined;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      tier: def.tier,
      xp: def.xp,
      icon: def.icon,
      unlocked,
      unlockedAt,
      progress,
      maxProgress: def.maxProgress,
      badgeColor: def.badgeColor,
      borderHighlight: def.borderHighlight,
      isSecret: def.isSecret,
      lockedTitle: def.lockedTitle,
      lockedDescription: def.lockedDescription,
      lockedIcon: def.lockedIcon,
    };
  });

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
    if (th10.unlocked) th10.unlockedAt = latestSessionDate;
  }

  const th20 = milestones.find((m) => m.id === "trophy_hunter_20");

  if (th20) {
    th20.progress = Math.min(20, unlockedBaseCount);
    th20.unlocked = unlockedBaseCount >= 20;
    if (th20.unlocked) th20.unlockedAt = latestSessionDate;
  }

  const th30 = milestones.find((m) => m.id === "trophy_hunter_30");

  if (th30) {
    th30.progress = Math.min(30, unlockedBaseCount);
    th30.unlocked = unlockedBaseCount >= 30;
    if (th30.unlocked) th30.unlockedAt = latestSessionDate;
  }

  const cl = milestones.find((m) => m.id === "cozy_legend");

  if (cl) {
    const totalUnlockedAll = milestones.filter(
      (m) => m.id !== "cozy_legend" && m.unlocked,
    ).length;

    cl.progress = Math.min(40, totalUnlockedAll);
    cl.unlocked = totalUnlockedAll >= 40;
    if (cl.unlocked) cl.unlockedAt = latestSessionDate;
  }

  return milestones;
}
