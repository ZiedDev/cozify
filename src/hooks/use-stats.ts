import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@heroui/react";

import { TimeRangeFilter, CustomDateRange } from "@/menus/stats/types";
import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";
import { TodoItem } from "@/menus/todo/types";
import { StatsRollupEngine } from "@/services/stats-rollup-engine";
import { db } from "@/services/db";
import {
  filterSessionsByRange,
  filterTodosByRange,
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

  const setRange = useCallback((newRange: TimeRangeFilter) => {
    setRangeState(newRange);
    storageAdapter.setItem("cozify_stats_range", newRange);
  }, []);

  // Sync / reload helper
  const reloadFromStorage = useCallback(() => {
    const savedSessions = storageAdapter.getItem<SessionRecord[]>(
      STORAGE_KEYS.SESSIONS_HISTORY,
      [],
    );
    const savedTodos = storageAdapter.getItem<TodoItem[]>(
      STORAGE_KEYS.TODOS,
      [],
    );

    const s = Array.isArray(savedSessions) ? savedSessions : [];
    const t = Array.isArray(savedTodos) ? savedTodos : [];

    setSessions(s);
    setTodos(t);

    // Self-healing check: if rollups are empty or session count diverges, rebuild immediately
    const summary = StatsRollupEngine.getAllTimeSummary();

    if (
      (db.dailyRollups.getAll().length === 0 && s.length > 0) ||
      (s.length > 0 && summary.totalSessions !== s.length)
    ) {
      StatsRollupEngine.rebuildAll(s, t);
    }

    setRevision((prevRevision) => prevRevision + 1);
  }, []);

  // Initial one-time check for fresh boot rollups
  useEffect(() => {
    if (db.dailyRollups.getAll().length === 0 && sessions.length > 0) {
      StatsRollupEngine.rebuildAll(sessions, todos);
    }
  }, []); // Run once on mount

  // Listen to window focus, storage updates, & stats rollup updates
  useEffect(() => {
    const handleStorageChange = () => {
      reloadFromStorage();
    };

    const handleStatsUpdated = () => {
      setRevision((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cozify_achievements_changed", handleStorageChange);
    window.addEventListener("cozify_remote_synced", handleStorageChange);
    window.addEventListener("cozify_stats_updated", handleStatsUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "cozify_achievements_changed",
        handleStorageChange,
      );
      window.removeEventListener("cozify_remote_synced", handleStorageChange);
      window.removeEventListener("cozify_stats_updated", handleStatsUpdated);
    };
  }, [reloadFromStorage]);

  // Derived filtered data for table / raw logs
  const filteredSessions = useMemo(
    () => filterSessionsByRange(sessions, range, customDateRange),
    [sessions, range, customDateRange],
  );

  const filteredTodos = useMemo(
    () => filterTodosByRange(todos, range, customDateRange),
    [todos, range, customDateRange],
  );

  const activeTodos = useMemo(() => todos.filter((t) => !t.archived), [todos]);
  const completedTodosCount = useMemo(
    () => activeTodos.filter((t) => t.completed).length,
    [activeTodos],
  );

  // Pre-aggregated O(1) / O(K) stats queries
  const allTimeStats = useMemo(
    () =>
      StatsRollupEngine.calculateOverallStats(
        "all",
        null,
        activeTodos.length,
        completedTodosCount,
      ),
    [activeTodos.length, completedTodosCount, revision],
  );

  const overallStats = useMemo(
    () =>
      StatsRollupEngine.calculateOverallStats(
        range,
        customDateRange,
        activeTodos.length,
        completedTodosCount,
      ),
    [range, customDateRange, activeTodos.length, completedTodosCount, revision],
  );

  const dailyChartData = useMemo(
    () => StatsRollupEngine.calculateDailyChartData(range, customDateRange),
    [range, customDateRange, revision],
  );

  const heatmapData = useMemo(
    () => StatsRollupEngine.calculateHeatmapData(),
    [revision],
  );

  const timeOfDayStats = useMemo(
    () => StatsRollupEngine.calculateTimeOfDayStats(range, customDateRange),
    [range, customDateRange, revision],
  );

  const tagStats = useMemo(
    () => StatsRollupEngine.calculateTagStats(range, customDateRange, todos),
    [range, customDateRange, todos, revision],
  );

  const priorityStats = useMemo(
    () => StatsRollupEngine.calculatePriorityStats(todos),
    [todos, revision],
  );

  const milestones = useMemo(
    () => StatsRollupEngine.calculateMilestones(sessions, todos, allTimeStats),
    [sessions, todos, allTimeStats, revision],
  );

  // CRUD actions for sessions
  const deleteSession = useCallback(
    (id: string) => {
      db.sessions.delete(id);
      const nextSessions = sessions.filter((session) => session.id !== id);

      setSessions(nextSessions);
      StatsRollupEngine.rebuildAll(nextSessions, todos);
      toast("Session deleted");
    },
    [sessions, todos],
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<SessionRecord>) => {
      let updatedRecord: SessionRecord | null = null;
      const nextSessions = sessions.map((session) => {
        if (session.id !== id) return session;
        updatedRecord = { ...session, ...updates, updatedAt: Date.now() };

        return updatedRecord;
      });

      if (updatedRecord) {
        db.sessions.save(updatedRecord);
      }

      setSessions(nextSessions);
      StatsRollupEngine.rebuildAll(nextSessions, todos);
      toast("Session updated");
    },
    [sessions, todos],
  );

  const clearAllSessions = useCallback(() => {
    db.sessions.clear();
    setSessions([]);
    StatsRollupEngine.rebuildAll([], todos);
    toast("All session history cleared");
  }, [todos]);

  const copySummaryToClipboard = useCallback(() => {
    const summary =
      `📊 Cozify Focus Summary\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱️ Total Focus: ${formatMinutesDisplay(overallStats.totalFocusMinutes)}\n` +
      `🎯 Pomodoros: ${overallStats.totalCycles} (${overallStats.cycleCompletionRate}% hit rate)\n` +
      `🔥 Active Streak: ${overallStats.currentStreakDays} days (Best: ${overallStats.bestStreakDays})\n` +
      `✅ Tasks: ${overallStats.tasksCompleted}/${overallStats.tasksTotal} completed (${overallStats.taskCompletionRate}%)\n` +
      `🌅 Peak Rhythm: ${overallStats.peakProductivePeriod}\n` +
      `🏆 Achievements: ${milestones.filter((milestone) => milestone.unlocked).length}/${milestones.length} unlocked`;

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
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        unlocked: milestone.unlocked,
        progress: milestone.progress,
        maxProgress: milestone.maxProgress,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = `cozify-stats-${new Date().toISOString().split("T")[0]}.json`;
    downloadLink.click();
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
