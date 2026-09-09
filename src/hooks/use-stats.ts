import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@heroui/react";

import { TimeRangeFilter, CustomDateRange } from "@/menus/stats/types";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";
import { TodoItem } from "@/menus/todo/types";
import {
  filterSessionsByRange,
  filterTodosByRange,
  calculateOverallStats,
  calculateDailyChartData,
  calculateHeatmapData,
  calculateTimeOfDayStats,
  calculateTagStats,
  calculatePriorityStats,
  calculateMilestones,
  formatMinutesDisplay,
} from "@/menus/stats/logic/stats-calculator";

export function useStats() {
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    storageAdapter.getItem<SessionRecord[]>(STORAGE_KEYS.SESSIONS_HISTORY, []),
  );
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, []),
  );
  const [range, setRangeState] = useState<TimeRangeFilter>(() =>
    storageAdapter.getItem<TimeRangeFilter>("cozify_stats_range", "week"),
  );
  const [customDateRange, setCustomDateRange] =
    useState<CustomDateRange | null>(null);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] =
    useState<boolean>(false);

  const [revision, setRevision] = useState<number>(0);

  const setRange = useCallback((r: TimeRangeFilter) => {
    setRangeState(r);
    storageAdapter.setItem("cozify_stats_range", r);
  }, []);

  // Sync / reload helper
  const reloadFromStorage = useCallback(() => {
    const s = storageAdapter.getItem<SessionRecord[]>(
      STORAGE_KEYS.SESSIONS_HISTORY,
      [],
    );
    const t = storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, []);

    setSessions(Array.isArray(s) ? s : []);
    setTodos(Array.isArray(t) ? t : []);
    setRevision((r) => r + 1);
  }, []);

  // Listen to window focus & storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      reloadFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);
    window.addEventListener("cozify_achievements_changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
      window.removeEventListener(
        "cozify_achievements_changed",
        handleStorageChange,
      );
    };
  }, [reloadFromStorage]);

  // Derived filtered data
  const filteredSessions = useMemo(
    () => filterSessionsByRange(sessions, range, customDateRange),
    [sessions, range, customDateRange],
  );

  const filteredTodos = useMemo(
    () => filterTodosByRange(todos, range, customDateRange),
    [todos, range, customDateRange],
  );

  const allTimeStats = useMemo(
    () => calculateOverallStats(sessions, todos),
    [sessions, todos],
  );

  const overallStats = useMemo(
    () => calculateOverallStats(filteredSessions, filteredTodos),
    [filteredSessions, filteredTodos],
  );

  const dailyChartData = useMemo(
    () =>
      calculateDailyChartData(
        filteredSessions,
        filteredTodos,
        range,
        customDateRange,
      ),
    [filteredSessions, filteredTodos, range, customDateRange],
  );

  const heatmapData = useMemo(
    () => calculateHeatmapData(sessions, todos),
    [sessions, todos],
  );

  const timeOfDayStats = useMemo(
    () => calculateTimeOfDayStats(filteredSessions),
    [filteredSessions],
  );

  const tagStats = useMemo(
    () => calculateTagStats(filteredSessions, filteredTodos),
    [filteredSessions, filteredTodos],
  );

  const priorityStats = useMemo(
    () => calculatePriorityStats(filteredTodos),
    [filteredTodos],
  );

  const milestones = useMemo(
    () => calculateMilestones(sessions, todos, allTimeStats),
    [sessions, todos, allTimeStats, revision],
  );

  // CRUD actions for sessions
  const deleteSession = useCallback(
    (id: string) => {
      const next = sessions.filter((s) => s.id !== id);

      setSessions(next);
      storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, next);
      toast("Session deleted");
    },
    [sessions],
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<SessionRecord>) => {
      const next = sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      );

      setSessions(next);
      storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, next);
      toast("Session updated");
    },
    [sessions],
  );

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    storageAdapter.removeItem(STORAGE_KEYS.SESSIONS_HISTORY);
    toast("All session history cleared");
  }, []);

  const copySummaryToClipboard = useCallback(() => {
    const summary =
      `📊 Cozify Focus Summary\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱️ Total Focus: ${formatMinutesDisplay(overallStats.totalFocusMinutes)}\n` +
      `🎯 Pomodoros: ${overallStats.totalCycles} (${overallStats.cycleCompletionRate}% hit rate)\n` +
      `🔥 Active Streak: ${overallStats.currentStreakDays} days (Best: ${overallStats.bestStreakDays})\n` +
      `✅ Tasks: ${overallStats.tasksCompleted}/${overallStats.tasksTotal} completed (${overallStats.taskCompletionRate}%)\n` +
      `🌅 Peak Rhythm: ${overallStats.peakProductivePeriod}\n` +
      `🏆 Achievements: ${milestones.filter((m) => m.unlocked).length}/${milestones.length} unlocked`;

    navigator.clipboard
      .writeText(summary)
      .then(() => toast("Summary copied to clipboard!"))
      .catch(() => toast("Failed to copy summary"));
  }, [overallStats, milestones]);

  const exportStatsJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      overallStats,
      sessions,
      todos,
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        unlocked: m.unlocked,
        progress: m.progress,
        maxProgress: m.maxProgress,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `cozify-stats-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported stats JSON file");
  }, [overallStats, sessions, todos, milestones]);

  return {
    sessions,
    todos,
    range,
    setRange,
    customDateRange,
    setCustomDateRange,
    isAchievementsModalOpen,
    setIsAchievementsModalOpen,
    filteredSessions,
    filteredTodos,
    overallStats,
    allTimeStats,
    dailyChartData,
    heatmapData,
    timeOfDayStats,
    tagStats,
    priorityStats,
    milestones,
    deleteSession,
    updateSession,
    clearAllSessions,
    copySummaryToClipboard,
    exportStatsJson,
  };
}
