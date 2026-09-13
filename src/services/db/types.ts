import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";
import { TodoItem } from "@/menus/todo/types";

export type AppSettings = Record<string, any>;

export type SessionRecord = {
  id: string;
  createdAt: number;
  title: string;
  tag?: string;
  cyclesCompleted?: number;
  sprintsCompleted?: number; // legacy backwards compatibility
  targetCycles?: number;
  targetSprints?: number; // legacy backwards compatibility
  focusMinutes: number;
  overtimeMinutes?: number;
  overtimeSeconds?: number;
  notes?: string;
  updatedAt?: number;
};

export type DailyRollupRecord = {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  overtimeMinutes: number;
  sessionCount: number;
  cyclesCompleted: number;
  targetCycles: number;
  longestSessionMinutes: number;
  hourlyMinutes: Record<string, number>; // "00"-"23" -> minutes
  tagMinutes: Record<string, number>; // tagId -> minutes
  tagOvertimeMinutes: Record<string, number>;
  tasksCompletedCount: number;
  taskTagsCompleted: Record<string, number>;
  taskPriorityCompleted: Record<string, number>;
  updatedAt: number;
};

export type AllTimeStatsRecord = {
  totalFocusMinutes: number;
  totalOvertimeMinutes: number;
  totalSessions: number;
  totalCycles: number;
  targetCyclesTotal: number;
  longestSessionMinutes: number;
  currentStreakDays: number;
  bestStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalActiveDays: number;
  tasksTotal: number;
  tasksCompleted: number;
  tagMinutes: Record<string, number>;
  hourlyMinutes: Record<string, number>;
  updatedAt: number;
};

export type DBStoreMap = {
  sessions: SessionRecord;
  todos: TodoItem;
  customBackgrounds: ThemeBackground;
  customPlaylists: Playlist;
  dailyRollups: DailyRollupRecord;
  statsSummary: AllTimeStatsRecord & { key: string };
  syncQueue: SyncQueueItem;
};

export type StoreName = keyof DBStoreMap;

export type SyncQueueItem = {
  id: string;
  store: StoreName;
  action: "create" | "update" | "delete";
  entityId: string;
  payload?: unknown;
  timestamp: number;
};

export type SyncStats = {
  pendingCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  providerName?: string;
};

/**
 * Type for online cloud providers (e.g. Supabase, MongoDB, Firebase)
 */
export type RemoteDatabaseProvider = {
  name: string;
  pushBatch(
    items: SyncQueueItem[],
  ): Promise<{ success: boolean; syncedIds: string[] }>;
  pullChanges(sinceTimestamp: number): Promise<{
    sessions?: SessionRecord[];
    todos?: TodoItem[];
    customBackgrounds?: ThemeBackground[];
    customPlaylists?: Playlist[];
    timestamp: number;
  }>;
};
