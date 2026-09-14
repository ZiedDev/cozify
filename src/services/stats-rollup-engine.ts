import { db } from "./db";
import {
  DailyRollupRecord,
  AllTimeStatsRecord,
  SessionRecord,
} from "./db/types";

import {
  TimeRangeFilter,
  CustomDateRange,
  DayActivity,
  TimeOfDayStat,
  TagStat,
  PriorityStat,
  Milestone,
  OverallStats,
} from "@/menus/stats/types";
import { TodoItem, PRESET_TAGS, PRIORITY_CONFIG } from "@/menus/todo/types";
import { calculateMilestones as calculateMilestonesLogic } from "@/menus/stats/logic/stats-calculator";
import { getTagInfo } from "@/config/tags";

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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toDateString(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createEmptyDailyRollup(date: string): DailyRollupRecord {
  return {
    date,
    focusMinutes: 0,
    overtimeMinutes: 0,
    sessionCount: 0,
    cyclesCompleted: 0,
    targetCycles: 0,
    longestSessionMinutes: 0,
    hourlyMinutes: {},
    tagMinutes: {},
    tagOvertimeMinutes: {},
    tasksCompletedCount: 0,
    taskTagsCompleted: {},
    taskPriorityCompleted: {},
    updatedAt: Date.now(),
  };
}

export function createEmptyAllTimeSummary(): AllTimeStatsRecord {
  return {
    totalFocusMinutes: 0,
    totalOvertimeMinutes: 0,
    totalSessions: 0,
    totalCycles: 0,
    targetCyclesTotal: 0,
    longestSessionMinutes: 0,
    currentStreakDays: 0,
    bestStreakDays: 0,
    lastActiveDate: "",
    totalActiveDays: 0,
    tasksTotal: 0,
    tasksCompleted: 0,
    tagMinutes: {},
    hourlyMinutes: {},
    updatedAt: Date.now(),
  };
}

class StatsRollupEngineService {
  /**
   * Reads all rollups from memory cache as a fast key-value Map
   */
  public getRollupsMap(): Map<string, DailyRollupRecord> {
    const list = db.dailyRollups.getAll();
    const map = new Map<string, DailyRollupRecord>();

    for (const item of list) {
      if (item && item.date) {
        map.set(item.date, item);
      }
    }

    return map;
  }

  /**
   * Reads all-time summary from memory cache
   */
  public getAllTimeSummary(): AllTimeStatsRecord {
    const summary = db.statsSummary.get();

    return summary || createEmptyAllTimeSummary();
  }

  /**
   * Incremental O(1) update when a Pomodoro focus session finishes
   */
  public recordSession(session: SessionRecord): void {
    const dateStr = toDateString(session.createdAt);
    const sessionHour = String(new Date(session.createdAt).getHours()).padStart(
      2,
      "0",
    );

    const existingRollup =
      db.dailyRollups.get(dateStr) || createEmptyDailyRollup(dateStr);

    const focusMins = session.focusMinutes || 0;
    const overtimeMins = session.overtimeMinutes || 0;
    const cycles = session.cyclesCompleted || session.sprintsCompleted || 1;
    const target = session.targetCycles || session.targetSprints || 1;

    // Update Daily Rollup
    const updatedRollup: DailyRollupRecord = {
      ...existingRollup,
      focusMinutes: existingRollup.focusMinutes + focusMins,
      overtimeMinutes: existingRollup.overtimeMinutes + overtimeMins,
      sessionCount: existingRollup.sessionCount + 1,
      cyclesCompleted: existingRollup.cyclesCompleted + cycles,
      targetCycles: existingRollup.targetCycles + target,
      longestSessionMinutes: Math.max(
        existingRollup.longestSessionMinutes,
        focusMins,
      ),
      hourlyMinutes: {
        ...existingRollup.hourlyMinutes,
        [sessionHour]:
          (existingRollup.hourlyMinutes[sessionHour] || 0) + focusMins,
      },
      tagMinutes: {
        ...existingRollup.tagMinutes,
        ...(session.tag
          ? {
              [session.tag.toLowerCase()]:
                (existingRollup.tagMinutes[session.tag.toLowerCase()] || 0) +
                focusMins,
            }
          : {}),
      },
      tagOvertimeMinutes: {
        ...existingRollup.tagOvertimeMinutes,
        ...(session.tag && overtimeMins > 0
          ? {
              [session.tag.toLowerCase()]:
                (existingRollup.tagOvertimeMinutes[session.tag.toLowerCase()] ||
                  0) + overtimeMins,
            }
          : {}),
      },
      updatedAt: Date.now(),
    };

    db.dailyRollups.save(updatedRollup);

    // Update All-Time Summary
    const summary = this.getAllTimeSummary();
    const isNewActiveDay =
      !existingRollup.sessionCount && !existingRollup.tasksCompletedCount;

    // Streaks calculation
    let currentStreak = summary.currentStreakDays;
    const todayStr = toDateString(new Date());

    if (summary.lastActiveDate === todayStr) {
      // Already active today, streak unchanged
    } else {
      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toDateString(yesterday);

      if (summary.lastActiveDate === yesterdayStr) {
        currentStreak += 1;
      } else if (!summary.lastActiveDate) {
        currentStreak = 1;
      } else {
        currentStreak = 1;
      }
    }

    const updatedSummary: AllTimeStatsRecord = {
      ...summary,
      totalFocusMinutes: summary.totalFocusMinutes + focusMins,
      totalOvertimeMinutes: summary.totalOvertimeMinutes + overtimeMins,
      totalSessions: summary.totalSessions + 1,
      totalCycles: summary.totalCycles + cycles,
      targetCyclesTotal: summary.targetCyclesTotal + target,
      longestSessionMinutes: Math.max(summary.longestSessionMinutes, focusMins),
      currentStreakDays: currentStreak,
      bestStreakDays: Math.max(summary.bestStreakDays, currentStreak),
      lastActiveDate: dateStr,
      totalActiveDays: summary.totalActiveDays + (isNewActiveDay ? 1 : 0),
      tagMinutes: {
        ...summary.tagMinutes,
        ...(session.tag
          ? {
              [session.tag.toLowerCase()]:
                (summary.tagMinutes[session.tag.toLowerCase()] || 0) +
                focusMins,
            }
          : {}),
      },
      hourlyMinutes: {
        ...summary.hourlyMinutes,
        [sessionHour]: (summary.hourlyMinutes[sessionHour] || 0) + focusMins,
      },
      updatedAt: Date.now(),
    };

    db.statsSummary.save(updatedSummary);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cozify_stats_updated"));
      window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
    }
  }

  /**
   * Syncs completed todo metadata into daily rollups & summary
   */
  public recordTodoChange(todos: TodoItem[]): void {
    const rollupsMap = this.getRollupsMap();
    let totalCompleted = 0;
    const activeTodos = todos.filter((t) => !t.archived);

    // Reset task fields on rollups and re-apply from active todos
    for (const [dateKey, rollup] of rollupsMap.entries()) {
      rollupsMap.set(dateKey, {
        ...rollup,
        tasksCompletedCount: 0,
        taskTagsCompleted: {},
        taskPriorityCompleted: {},
      });
    }

    for (const todo of activeTodos) {
      if (todo.completed && todo.completedAt) {
        totalCompleted += 1;
        const dateStr = toDateString(todo.completedAt);
        const rollup =
          rollupsMap.get(dateStr) || createEmptyDailyRollup(dateStr);

        const nextTags = { ...rollup.taskTagsCompleted };

        if (todo.tag) {
          const t = todo.tag.toLowerCase();

          nextTags[t] = (nextTags[t] || 0) + 1;
        }

        const nextPriority = { ...rollup.taskPriorityCompleted };

        if (todo.priority && todo.priority !== "none") {
          nextPriority[todo.priority] = (nextPriority[todo.priority] || 0) + 1;
        }

        rollupsMap.set(dateStr, {
          ...rollup,
          tasksCompletedCount: rollup.tasksCompletedCount + 1,
          taskTagsCompleted: nextTags,
          taskPriorityCompleted: nextPriority,
          updatedAt: Date.now(),
        });
      }
    }

    db.dailyRollups.saveAll(Array.from(rollupsMap.values()));

    const summary = this.getAllTimeSummary();

    db.statsSummary.save({
      ...summary,
      tasksTotal: activeTodos.length,
      tasksCompleted: totalCompleted,
      updatedAt: Date.now(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cozify_stats_updated"));
    }
  }

  /**
   * Rebuilds all rollups and summary from scratch (Migration / Import / Hard Reset)
   */
  public rebuildAll(sessions: SessionRecord[], todos: TodoItem[]): void {
    const rollupsMap = new Map<string, DailyRollupRecord>();
    const activeDatesSet = new Set<string>();

    let totalFocusMins = 0;
    let totalOvertimeMins = 0;
    let totalSessions = 0;
    let totalCycles = 0;
    let targetCyclesTotal = 0;
    let longestSessionMins = 0;
    const allTimeTagMinutes: Record<string, number> = {};
    const allTimeHourlyMinutes: Record<string, number> = {};

    // 1. Process Sessions
    for (const session of sessions) {
      const dateStr = toDateString(session.createdAt);
      const sessionHour = String(
        new Date(session.createdAt).getHours(),
      ).padStart(2, "0");

      activeDatesSet.add(dateStr);

      const focusMins = session.focusMinutes || 0;
      const overtimeMins = session.overtimeMinutes || 0;
      const cycles = session.cyclesCompleted || session.sprintsCompleted || 1;
      const target = session.targetCycles || session.targetSprints || 1;

      totalFocusMins += focusMins;
      totalOvertimeMins += overtimeMins;
      totalSessions += 1;
      totalCycles += cycles;
      targetCyclesTotal += target;
      longestSessionMins = Math.max(longestSessionMins, focusMins);

      allTimeHourlyMinutes[sessionHour] =
        (allTimeHourlyMinutes[sessionHour] || 0) + focusMins;
      if (session.tag) {
        const tagKey = session.tag.toLowerCase();

        allTimeTagMinutes[tagKey] =
          (allTimeTagMinutes[tagKey] || 0) + focusMins;
      }

      const rollup = rollupsMap.get(dateStr) || createEmptyDailyRollup(dateStr);

      rollup.focusMinutes += focusMins;
      rollup.overtimeMinutes += overtimeMins;
      rollup.sessionCount += 1;
      rollup.cyclesCompleted += cycles;
      rollup.targetCycles += target;
      rollup.longestSessionMinutes = Math.max(
        rollup.longestSessionMinutes,
        focusMins,
      );
      rollup.hourlyMinutes[sessionHour] =
        (rollup.hourlyMinutes[sessionHour] || 0) + focusMins;

      if (session.tag) {
        const tagKey = session.tag.toLowerCase();

        rollup.tagMinutes[tagKey] =
          (rollup.tagMinutes[tagKey] || 0) + focusMins;
        if (overtimeMins > 0) {
          rollup.tagOvertimeMinutes[tagKey] =
            (rollup.tagOvertimeMinutes[tagKey] || 0) + overtimeMins;
        }
      }

      rollup.updatedAt = Date.now();
      rollupsMap.set(dateStr, rollup);
    }

    // 2. Process Todos
    const activeTodos = todos.filter((t) => !t.archived);
    let totalCompleted = 0;

    for (const todo of activeTodos) {
      if (todo.completed && todo.completedAt) {
        totalCompleted += 1;
        const dateStr = toDateString(todo.completedAt);

        activeDatesSet.add(dateStr);

        const rollup =
          rollupsMap.get(dateStr) || createEmptyDailyRollup(dateStr);

        rollup.tasksCompletedCount += 1;

        if (todo.tag) {
          const t = todo.tag.toLowerCase();

          rollup.taskTagsCompleted[t] = (rollup.taskTagsCompleted[t] || 0) + 1;
        }

        if (todo.priority && todo.priority !== "none") {
          rollup.taskPriorityCompleted[todo.priority] =
            (rollup.taskPriorityCompleted[todo.priority] || 0) + 1;
        }

        rollup.updatedAt = Date.now();
        rollupsMap.set(dateStr, rollup);
      }
    }

    // 3. Compute Streaks
    const sortedDates = Array.from(activeDatesSet).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDateTs: number | null = null;

    for (const dateString of sortedDates) {
      const [year, month, day] = dateString.split("-").map(Number);
      const currentTs = new Date(year, month - 1, day).getTime();

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

      prevDateTs = currentTs;
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // Current Streak
    const now = new Date();
    const todayStr = toDateString(now);
    const yesterday = new Date(now);

    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);

    let currentStreak = 0;
    let checkDate = new Date(now);

    if (activeDatesSet.has(todayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (activeDatesSet.has(yesterdayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 2);
    }

    if (currentStreak > 0) {
      while (activeDatesSet.has(toDateString(checkDate))) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 4. Save to Repository
    db.dailyRollups.saveAll(Array.from(rollupsMap.values()));

    const summaryRecord: AllTimeStatsRecord = {
      totalFocusMinutes: totalFocusMins,
      totalOvertimeMinutes: totalOvertimeMins,
      totalSessions,
      totalCycles,
      targetCyclesTotal,
      longestSessionMinutes: longestSessionMins,
      currentStreakDays: currentStreak,
      bestStreakDays: bestStreak,
      lastActiveDate: sortedDates[sortedDates.length - 1] || "",
      totalActiveDays: activeDatesSet.size,
      tasksTotal: activeTodos.length,
      tasksCompleted: totalCompleted,
      tagMinutes: allTimeTagMinutes,
      hourlyMinutes: allTimeHourlyMinutes,
      updatedAt: Date.now(),
    };

    db.statsSummary.save(summaryRecord);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cozify_stats_updated"));
    }
  }

  /**
   * Fast date-range querying using pre-computed daily rollups (O(K) where K <= 30)
   */
  public getRollupsForRange(
    range: TimeRangeFilter,
    customRange?: CustomDateRange | null,
  ): { rollups: DailyRollupRecord[]; startDate: string; endDate: string } {
    const rollupsMap = this.getRollupsMap();
    const now = new Date();
    const todayStr = toDateString(now);

    let startDate = todayStr;
    let endDate = todayStr;

    if (range === "today") {
      startDate = todayStr;
      endDate = todayStr;
    } else if (range === "week") {
      const past = new Date(now);

      past.setDate(past.getDate() - 6);
      startDate = toDateString(past);
      endDate = todayStr;
    } else if (range === "month") {
      const past = new Date(now);

      past.setDate(past.getDate() - 29);
      startDate = toDateString(past);
      endDate = todayStr;
    } else if (range === "custom" && customRange?.start && customRange?.end) {
      startDate = customRange.start;
      endDate = customRange.end;
    } else {
      // "all"
      return {
        rollups: Array.from(rollupsMap.values()),
        startDate: "",
        endDate: "",
      };
    }

    const startTs = new Date(`${startDate}T00:00:00`).getTime();
    const endTs = new Date(`${endDate}T23:59:59.999`).getTime();

    const filtered: DailyRollupRecord[] = [];

    for (let curTs = startTs; curTs <= endTs; curTs += 86400000) {
      const curDateStr = toDateString(curTs);
      const existing =
        rollupsMap.get(curDateStr) || createEmptyDailyRollup(curDateStr);

      filtered.push(existing);
    }

    return { rollups: filtered, startDate, endDate };
  }

  /**
   * Computes OverallStats from rollups in O(1) or O(K)
   */
  public calculateOverallStats(
    range: TimeRangeFilter,
    customRange?: CustomDateRange | null,
    activeTodosCount: number = 0,
    completedTodosCount: number = 0,
  ): OverallStats {
    const summary = this.getAllTimeSummary();

    if (range === "all") {
      const cycleRate =
        summary.targetCyclesTotal > 0
          ? Math.min(
              100,
              Math.round(
                (summary.totalCycles / summary.targetCyclesTotal) * 100,
              ),
            )
          : summary.totalCycles > 0
            ? 100
            : 0;

      const avgSession =
        summary.totalSessions > 0
          ? Math.round(summary.totalFocusMinutes / summary.totalSessions)
          : 0;

      const taskRate =
        activeTodosCount > 0
          ? Math.min(
              100,
              Math.round((completedTodosCount / activeTodosCount) * 100),
            )
          : 0;

      const todayRollup = db.dailyRollups.get(toDateString(new Date()));

      return {
        totalFocusMinutes: summary.totalFocusMinutes,
        totalSessions: summary.totalSessions,
        totalCycles: summary.totalCycles,
        targetCyclesTotal: summary.targetCyclesTotal,
        cycleCompletionRate: cycleRate,
        avgSessionMinutes: avgSession,
        longestSessionMinutes: summary.longestSessionMinutes,
        totalOvertimeMinutes: summary.totalOvertimeMinutes,
        currentStreakDays: summary.currentStreakDays,
        bestStreakDays: summary.bestStreakDays,
        totalActiveDays: summary.totalActiveDays,
        tasksTotal: activeTodosCount,
        tasksCompleted: completedTodosCount,
        taskCompletionRate: taskRate,
        tasksCompletedToday: todayRollup?.tasksCompletedCount || 0,
        peakProductivePeriod: this.getPeakPeriodFromHourly(
          summary.hourlyMinutes,
        ),
      };
    }

    const { rollups } = this.getRollupsForRange(range, customRange);

    let totalFocusMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalSessions = 0;
    let totalCycles = 0;
    let targetCyclesTotal = 0;
    let longestSessionMinutes = 0;
    let tasksCompleted = 0;
    const combinedHourly: Record<string, number> = {};

    for (const r of rollups) {
      totalFocusMinutes += r.focusMinutes;
      totalOvertimeMinutes += r.overtimeMinutes;
      totalSessions += r.sessionCount;
      totalCycles += r.cyclesCompleted;
      targetCyclesTotal += r.targetCycles;
      longestSessionMinutes = Math.max(
        longestSessionMinutes,
        r.longestSessionMinutes,
      );
      tasksCompleted += r.tasksCompletedCount;

      for (const [h, mins] of Object.entries(r.hourlyMinutes)) {
        combinedHourly[h] = (combinedHourly[h] || 0) + mins;
      }
    }

    const cycleCompletionRate =
      targetCyclesTotal > 0
        ? Math.min(100, Math.round((totalCycles / targetCyclesTotal) * 100))
        : totalCycles > 0
          ? 100
          : 0;

    const avgSessionMinutes =
      totalSessions > 0 ? Math.round(totalFocusMinutes / totalSessions) : 0;

    const todayRollup = db.dailyRollups.get(toDateString(new Date()));

    return {
      totalFocusMinutes,
      totalSessions,
      totalCycles,
      targetCyclesTotal,
      cycleCompletionRate,
      avgSessionMinutes,
      longestSessionMinutes,
      totalOvertimeMinutes,
      currentStreakDays: summary.currentStreakDays,
      bestStreakDays: summary.bestStreakDays,
      totalActiveDays: summary.totalActiveDays,
      tasksTotal: activeTodosCount,
      tasksCompleted,
      taskCompletionRate:
        activeTodosCount > 0
          ? Math.min(100, Math.round((tasksCompleted / activeTodosCount) * 100))
          : 0,
      tasksCompletedToday: todayRollup?.tasksCompletedCount || 0,
      peakProductivePeriod: this.getPeakPeriodFromHourly(combinedHourly),
    };
  }

  /**
   * Generates Daily / Weekly / Monthly Chart Activities directly from daily rollups (O(K))
   */
  public calculateDailyChartData(
    range: TimeRangeFilter,
    customRange?: CustomDateRange | null,
  ): DayActivity[] {
    const rollupsMap = this.getRollupsMap();
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
          : toDateString(now);

      const todayRollup =
        rollupsMap.get(targetDateStr) || createEmptyDailyRollup(targetDateStr);
      const hourlyActivities: DayActivity[] = [];
      const currentHour = now.getHours();

      for (let hour = 0; hour < 24; hour++) {
        const hourStr = String(hour).padStart(2, "0");
        const mins = todayRollup.hourlyMinutes[hourStr] || 0;
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour >= 12 ? "PM" : "AM";
        const shortLabel = `${displayHour} ${ampm}`;
        const fullLabel = `${displayHour}:00 ${ampm} - ${displayHour}:59 ${ampm}`;

        let intensity: 0 | 1 | 2 | 3 | 4 = 0;

        if (mins >= 45) intensity = 4;
        else if (mins >= 25) intensity = 3;
        else if (mins >= 10) intensity = 2;
        else if (mins > 0) intensity = 1;

        hourlyActivities.push({
          dateStr: `${targetDateStr}T${hourStr}:00:00`,
          dayLabel: shortLabel,
          fullDateLabel: fullLabel,
          focusMinutes: mins,
          cycleCount: mins > 0 ? Math.ceil(mins / 25) : 0,
          sessionCount: mins > 0 ? 1 : 0,
          taskCompletedCount: 0,
          intensityLevel: intensity,
          periodType: "hourly",
          dateRange: { start: targetDateStr, end: targetDateStr },
          isFuture: range === "today" ? hour > currentHour : false,
        });
      }

      return hourlyActivities;
    }

    // Determine start & end date
    let startDate: Date;
    let endDate: Date;

    if (range === "custom" && customRange?.start && customRange?.end) {
      startDate = new Date(`${customRange.start}T00:00:00`);
      endDate = new Date(`${customRange.end}T00:00:00`);
    } else if (range === "all") {
      let earliestTs = now.getTime() - 29 * 86400000;

      for (const [dateStr, rollup] of rollupsMap.entries()) {
        if (
          rollup.focusMinutes > 0 ||
          rollup.overtimeMinutes > 0 ||
          rollup.cyclesCompleted > 0 ||
          rollup.tasksCompletedCount > 0
        ) {
          const [y, m, d] = dateStr.split("-").map(Number);
          const ts = new Date(y, m - 1, d).getTime();

          if (ts < earliestTs) {
            earliestTs = ts;
          }
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
      // 7 days default ("week")
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

    const result: DayActivity[] = [];

    // A. DAILY BREAKDOWN (<= 31 days)
    if (diffDays <= 31) {
      for (let dayIndex = 0; dayIndex < diffDays; dayIndex++) {
        const currentDate = new Date(startDate);

        currentDate.setDate(currentDate.getDate() + dayIndex);

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dayNum = currentDate.getDate();
        const dayOfWeek = currentDate.getDay();
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        const dayName =
          diffDays <= 10 || range === "week"
            ? DAY_NAMES[dayOfWeek]
            : `${month + 1}/${dayNum}`;
        const fullDateLabel = `${DAY_NAMES[dayOfWeek]}, ${MONTH_NAMES[month]} ${dayNum}, ${year}`;

        const rollup = rollupsMap.get(dateStr);
        const focusMinutes = rollup?.focusMinutes || 0;
        const overtimeMinutes = rollup?.overtimeMinutes || 0;
        const totalPeriodMinutes = focusMinutes + overtimeMinutes;

        let intensity: 0 | 1 | 2 | 3 | 4 = 0;

        if (totalPeriodMinutes >= 120) intensity = 4;
        else if (totalPeriodMinutes >= 60) intensity = 3;
        else if (totalPeriodMinutes >= 25) intensity = 2;
        else if (totalPeriodMinutes > 0) intensity = 1;

        result.push({
          dateStr,
          dayLabel: dayName,
          fullDateLabel,
          focusMinutes,
          overtimeMinutes,
          totalPeriodMinutes: focusMinutes,
          cycleCount: rollup?.cyclesCompleted || 0,
          sessionCount: rollup?.sessionCount || 0,
          taskCompletedCount: rollup?.tasksCompletedCount || 0,
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

        let totalFocusMinutes = 0;
        let totalOvertimeMinutes = 0;
        let totalCycles = 0;
        let totalSessions = 0;
        let totalTasks = 0;

        for (let dayOffset = 0; dayOffset < daysInBucket; dayOffset++) {
          const dayDate = new Date(currentWeekStart);

          dayDate.setDate(dayDate.getDate() + dayOffset);
          const dateStr = toDateString(dayDate);
          const rollup = rollupsMap.get(dateStr);

          if (rollup) {
            totalFocusMinutes += rollup.focusMinutes;
            totalOvertimeMinutes += rollup.overtimeMinutes;
            totalCycles += rollup.cyclesCompleted;
            totalSessions += rollup.sessionCount;
            totalTasks += rollup.tasksCompletedCount;
          }
        }

        const avgDailyMinutes = Math.round(totalFocusMinutes / daysInBucket);
        const avgDailyOvertimeMinutes = Math.round(
          totalOvertimeMinutes / daysInBucket,
        );
        const shortLabel = `${currentWeekStart.getMonth() + 1}/${currentWeekStart.getDate()}`;
        const fullLabel = `Week of ${MONTH_NAMES[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} – ${MONTH_NAMES[currentWeekEnd.getMonth()]} ${currentWeekEnd.getDate()}`;

        const totalPeriodMinutes = totalFocusMinutes + totalOvertimeMinutes;
        const avgPeriodDaily = Math.round(totalPeriodMinutes / daysInBucket);
        const intensity: 0 | 1 | 2 | 3 | 4 =
          avgPeriodDaily >= 120
            ? 4
            : avgPeriodDaily >= 60
              ? 3
              : avgPeriodDaily >= 25
                ? 2
                : avgPeriodDaily > 0
                  ? 1
                  : 0;

        const weekStartStr = toDateString(currentWeekStart);
        const weekEndStr = toDateString(currentWeekEnd);

        result.push({
          dateStr: weekStartStr,
          dayLabel: shortLabel,
          fullDateLabel: fullLabel,
          focusMinutes: avgDailyMinutes,
          overtimeMinutes: avgDailyOvertimeMinutes,
          totalPeriodMinutes: totalFocusMinutes,
          cycleCount: totalCycles,
          sessionCount: totalSessions,
          taskCompletedCount: totalTasks,
          intensityLevel: intensity,
          periodType: "weekly",
          dateRange: { start: weekStartStr, end: weekEndStr },
        });

        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      return result;
    }

    // C. MONTHLY GROUPING (> 120 days, ~4+ months to years, e.g. "All-Time")
    const spansMultipleYears =
      startDate.getFullYear() !== endDate.getFullYear();
    let currentMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentMonth <= endMonth) {
      const monthStart = new Date(
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
        808,
      );
      const monthEnd = new Date(
        Math.min(endDate.getTime(), lastDayOfMonth.getTime()),
      );

      const daysInBucket = Math.max(
        1,
        Math.round((monthEnd.getTime() - monthStart.getTime()) / 86400000) + 1,
      );

      let totalFocusMinutes = 0;
      let totalOvertimeMinutes = 0;
      let totalCycles = 0;
      let totalSessions = 0;
      let totalTasks = 0;

      for (let dayOffset = 0; dayOffset < daysInBucket; dayOffset++) {
        const dayDate = new Date(monthStart);

        dayDate.setDate(dayDate.getDate() + dayOffset);
        const dateStr = toDateString(dayDate);
        const rollup = rollupsMap.get(dateStr);

        if (rollup) {
          totalFocusMinutes += rollup.focusMinutes;
          totalOvertimeMinutes += rollup.overtimeMinutes;
          totalCycles += rollup.cyclesCompleted;
          totalSessions += rollup.sessionCount;
          totalTasks += rollup.tasksCompletedCount;
        }
      }

      const avgDailyMinutes = Math.round(totalFocusMinutes / daysInBucket);
      const avgDailyOvertimeMinutes = Math.round(
        totalOvertimeMinutes / daysInBucket,
      );
      const monthIndex = currentMonth.getMonth();
      const shortLabel = spansMultipleYears
        ? `${MONTH_NAMES[monthIndex]} ${currentMonth.getFullYear()}`
        : MONTH_NAMES[monthIndex];
      const fullLabel = `${FULL_MONTH_NAMES[monthIndex]} ${currentMonth.getFullYear()}`;

      const totalPeriodMinutes = totalFocusMinutes + totalOvertimeMinutes;
      const avgPeriodDaily = Math.round(totalPeriodMinutes / daysInBucket);
      const intensity: 0 | 1 | 2 | 3 | 4 =
        avgPeriodDaily >= 120
          ? 4
          : avgPeriodDaily >= 60
            ? 3
            : avgPeriodDaily >= 25
              ? 2
              : avgPeriodDaily > 0
                ? 1
                : 0;

      const monthStartStr = toDateString(monthStart);
      const monthEndStr = toDateString(monthEnd);

      result.push({
        dateStr: monthStartStr,
        dayLabel: shortLabel,
        fullDateLabel: fullLabel,
        focusMinutes: avgDailyMinutes,
        overtimeMinutes: avgDailyOvertimeMinutes,
        totalPeriodMinutes: totalFocusMinutes,
        cycleCount: totalCycles,
        sessionCount: totalSessions,
        taskCompletedCount: totalTasks,
        intensityLevel: intensity,
        periodType: "monthly",
        dateRange: { start: monthStartStr, end: monthEndStr },
      });

      currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      );
    }

    return result;
  }

  /**
   * Generates Heatmap Grid from pre-aggregated rollups map in 52-week blocks (O(52*7), < 1ms)
   */
  public calculateHeatmapData(): {
    weeks: DayActivity[][];
    months: { label: string; weekIndex: number }[];
    rangeTitle: string;
  } {
    const rollupsMap = this.getRollupsMap();
    const now = new Date();
    const currentYear = now.getFullYear();
    let earliestYear = currentYear;
    const rangeTitle = "Year-Round Consistency & Focus Momentum";

    for (const [dateStr, rollup] of rollupsMap.entries()) {
      if (
        rollup.focusMinutes > 0 ||
        rollup.overtimeMinutes > 0 ||
        rollup.cyclesCompleted > 0 ||
        rollup.tasksCompletedCount > 0
      ) {
        const year = parseInt(dateStr.split("-")[0], 10);

        if (!isNaN(year) && year < earliestYear) {
          earliestYear = year;
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

      for (let weekIndex = 0; weekIndex < 52; weekIndex++) {
        const weekDays: DayActivity[] = [];

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const dayDate = new Date(startSunday);

          dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayOffset);

          const isFuture = dayDate.getTime() > todayEndTimestamp;
          const yearNum = dayDate.getFullYear();
          const monthNum = dayDate.getMonth();
          const dayNum = dayDate.getDate();
          const dayOfWeek = dayDate.getDay();
          const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const dayName = DAY_NAMES[dayOfWeek];
          const fullDateLabel = `${MONTH_NAMES[monthNum]} ${dayNum}, ${yearNum}`;

          const rollup = rollupsMap.get(dateStr);
          const focusMins = rollup?.focusMinutes || 0;
          const otMins = rollup?.overtimeMinutes || 0;
          const cycles = rollup?.cyclesCompleted || 0;
          const sessionCount = rollup?.sessionCount || 0;
          const taskCount = rollup?.tasksCompletedCount || 0;
          const totalProductiveMins = focusMins + otMins;

          let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;

          if (!isFuture) {
            if (totalProductiveMins >= 120) intensityLevel = 4;
            else if (totalProductiveMins >= 60) intensityLevel = 3;
            else if (totalProductiveMins >= 25) intensityLevel = 2;
            else if (totalProductiveMins > 0 || taskCount > 0)
              intensityLevel = 1;
          }

          weekDays.push({
            dateStr,
            dayLabel: dayName,
            fullDateLabel,
            focusMinutes: isFuture ? 0 : focusMins,
            overtimeMinutes: isFuture ? 0 : otMins,
            cycleCount: isFuture ? 0 : cycles,
            sessionCount: isFuture ? 0 : sessionCount,
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
   * Time of Day distribution from pre-aggregated hourly buckets
   */
  public calculateTimeOfDayStats(
    range: TimeRangeFilter,
    customRange?: CustomDateRange | null,
  ): TimeOfDayStat[] {
    const { rollups } = this.getRollupsForRange(range, customRange);
    const hourlyCombined: Record<string, number> = {};

    let totalMins = 0;

    for (const r of rollups) {
      for (const [hour, mins] of Object.entries(r.hourlyMinutes)) {
        hourlyCombined[hour] = (hourlyCombined[hour] || 0) + mins;
        totalMins += mins;
      }
    }

    const periods: Record<
      "morning" | "afternoon" | "evening" | "night",
      { minutes: number; count: number }
    > = {
      morning: { minutes: 0, count: 0 },
      afternoon: { minutes: 0, count: 0 },
      evening: { minutes: 0, count: 0 },
      night: { minutes: 0, count: 0 },
    };

    for (let h = 0; h < 24; h++) {
      const hourStr = String(h).padStart(2, "0");
      const mins = hourlyCombined[hourStr] || 0;

      if (h >= 5 && h < 12) {
        periods.morning.minutes += mins;
        if (mins > 0) periods.morning.count += 1;
      } else if (h >= 12 && h < 17) {
        periods.afternoon.minutes += mins;
        if (mins > 0) periods.afternoon.count += 1;
      } else if (h >= 17 && h < 22) {
        periods.evening.minutes += mins;
        if (mins > 0) periods.evening.count += 1;
      } else {
        periods.night.minutes += mins;
        if (mins > 0) periods.night.count += 1;
      }
    }

    const configs: Array<{
      period: "morning" | "afternoon" | "evening" | "night";
      label: string;
      timeRange: string;
      iconName: "sunrise" | "sun" | "sunset" | "moon";
    }> = [
      {
        period: "morning",
        label: "Morning Focus",
        timeRange: "5:00 AM – 12:00 PM",
        iconName: "sunrise",
      },
      {
        period: "afternoon",
        label: "Afternoon Deep Work",
        timeRange: "12:00 PM – 5:00 PM",
        iconName: "sun",
      },
      {
        period: "evening",
        label: "Evening Wind Down",
        timeRange: "5:00 PM – 10:00 PM",
        iconName: "sunset",
      },
      {
        period: "night",
        label: "Late Night Grit",
        timeRange: "10:00 PM – 5:00 AM",
        iconName: "moon",
      },
    ];

    return configs.map((cfg) => {
      const data = periods[cfg.period];
      const pct =
        totalMins > 0 ? Math.round((data.minutes / totalMins) * 100) : 0;

      return {
        period: cfg.period,
        label: cfg.label,
        timeRange: cfg.timeRange,
        minutes: data.minutes,
        sessionsCount: data.count,
        percentage: pct,
        iconName: cfg.iconName,
      };
    });
  }

  /**
   * Tag Analytics from rollups
   */
  public calculateTagStats(
    range: TimeRangeFilter,
    customRange?: CustomDateRange | null,
    allTodos: TodoItem[] = [],
  ): TagStat[] {
    const { rollups } = this.getRollupsForRange(range, customRange);
    const tagMinutesMap: Record<string, number> = {};
    const tagOvertimeMap: Record<string, number> = {};
    const tagCompletedTasksMap: Record<string, number> = {};

    let totalRangeMinutes = 0;

    for (const r of rollups) {
      for (const [tag, mins] of Object.entries(r.tagMinutes)) {
        tagMinutesMap[tag] = (tagMinutesMap[tag] || 0) + mins;
        totalRangeMinutes += mins;
      }
      for (const [tag, mins] of Object.entries(r.tagOvertimeMinutes)) {
        tagOvertimeMap[tag] = (tagOvertimeMap[tag] || 0) + mins;
      }
      for (const [tag, count] of Object.entries(r.taskTagsCompleted)) {
        tagCompletedTasksMap[tag] = (tagCompletedTasksMap[tag] || 0) + count;
      }
    }

    const tagTaskTotalMap: Record<string, number> = {};

    for (const todo of allTodos) {
      if (todo.tag && !todo.archived) {
        const t = todo.tag.toLowerCase();

        tagTaskTotalMap[t] = (tagTaskTotalMap[t] || 0) + 1;
      }
    }

    const allKnownTags = new Set([
      ...Object.keys(tagMinutesMap),
      ...Object.keys(tagCompletedTasksMap),
      ...PRESET_TAGS.map((p) => p.id.toLowerCase()),
    ]);

    const result: TagStat[] = [];

    for (const tagId of allKnownTags) {
      const mins = tagMinutesMap[tagId] || 0;
      const otMins = tagOvertimeMap[tagId] || 0;
      const completedCount = tagCompletedTasksMap[tagId] || 0;
      const totalTasks = tagTaskTotalMap[tagId] || completedCount;

      if (
        mins === 0 &&
        totalTasks === 0 &&
        !PRESET_TAGS.some((p) => p.id.toLowerCase() === tagId)
      ) {
        continue;
      }

      const info = getTagInfo(tagId);
      const pct =
        totalRangeMinutes > 0
          ? Math.round((mins / totalRangeMinutes) * 100)
          : 0;

      result.push({
        id: tagId,
        label: info?.label || tagId.charAt(0).toUpperCase() + tagId.slice(1),
        color: info?.color || "text-accent bg-accent/10 border-accent/30",
        focusMinutes: mins,
        overtimeMinutes: otMins > 0 ? otMins : undefined,
        taskCount: totalTasks,
        completedTaskCount: completedCount,
        percentage: pct,
      });
    }

    return result.sort((a, b) => b.focusMinutes - a.focusMinutes);
  }

  /**
   * Priority Distribution
   */
  public calculatePriorityStats(todos: TodoItem[]): PriorityStat[] {
    const counts: Record<string, { total: number; completed: number }> = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    };

    let totalTasks = 0;

    for (const todo of todos) {
      if (todo.archived || !todo.priority || todo.priority === "none") continue;
      if (counts[todo.priority]) {
        counts[todo.priority].total += 1;
        totalTasks += 1;
        if (todo.completed) {
          counts[todo.priority].completed += 1;
        }
      }
    }

    return (["high", "medium", "low"] as const).map((p) => {
      const data = counts[p];
      const cfg = PRIORITY_CONFIG[p];
      const pct =
        totalTasks > 0 ? Math.round((data.total / totalTasks) * 100) : 0;

      return {
        id: p,
        label: cfg.label,
        color: cfg.color,
        dotColor: cfg.dotColor,
        total: data.total,
        completed: data.completed,
        percentage: pct,
      };
    });
  }

  /**
   * Milestones evaluation from pre-computed metrics
   */
  public calculateMilestones(
    sessions: SessionRecord[],
    todos: TodoItem[],
    overallStats?: OverallStats,
  ): Milestone[] {
    const overall =
      overallStats ||
      this.calculateOverallStats(
        "all",
        null,
        todos.filter((t) => !t.archived).length,
        todos.filter((t) => !t.archived && t.completed).length,
      );

    return calculateMilestonesLogic(sessions, todos, overall);
  }

  private getPeakPeriodFromHourly(
    hourlyMinutes: Record<string, number>,
  ): string {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let night = 0;

    for (const [hourStr, mins] of Object.entries(hourlyMinutes)) {
      const h = parseInt(hourStr, 10);

      if (h >= 5 && h < 12) morning += mins;
      else if (h >= 12 && h < 17) afternoon += mins;
      else if (h >= 17 && h < 22) evening += mins;
      else night += mins;
    }

    const max = Math.max(morning, afternoon, evening, night);

    if (max === 0) return "Morning";
    if (max === morning) return "Morning";
    if (max === afternoon) return "Afternoon";
    if (max === evening) return "Evening";

    return "Night";
  }
}

export const StatsRollupEngine = new StatsRollupEngineService();
