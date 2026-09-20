import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";
import { TodoItem } from "@/menus/todo/types";

export type AppSettings = Record<string, any>;

/**
 * Historical pomodoro/focus session record
 */
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
  isDeleted?: boolean;
  version?: number;
  updatedAt?: number;
};

/**
 * Daily pre-aggregated statistics for fast rendering
 */
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

/**
 * All-time lifetime summary statistics record
 */
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

/**
 * Mapping of all persistent table names to their corresponding record schemas
 */
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

/**
 * Syncable entity store names that participate in cloud replication
 */
export type SyncableStoreName =
  "sessions" | "todos" | "customBackgrounds" | "customPlaylists";

/**
 * Single mutation entry in the append-only local outbox queue
 */
export type SyncQueueItem = {
  id: string;
  store: StoreName;
  action: "create" | "update" | "delete";
  entityId: string;
  payload?: unknown;
  timestamp: number;
};

/**
 * Synchronization engine state metrics
 */
export type SyncStats = {
  pendingCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  providerName?: string;
};

/**
 * Cloud database provider contract for replication and delta synchronization
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

/**
 * Standard CRUD repository contract for domain entity stores
 */
export type EntityRepository<T extends { id: string }> = {
  getAll(): T[];
  get(id: string): T | null;
  save(item: T): void;
  saveAll(items: T[]): void;
  delete(id: string): void;
  clear(): void;
};
