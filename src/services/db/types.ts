import { ThemeConfig } from "@/config/themes";
import { TodoItem } from "@/menus/todo/types";

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

export type AppSettings = {
  todo?: {
    mode?: "minimal" | "detailed";
  };
  [key: string]: unknown;
};

export type DBStoreMap = {
  sessions: SessionRecord;
  todos: TodoItem;
  theme: Partial<ThemeConfig> & { key: string };
  timer: Record<string, unknown> & { key: string };
  settings: AppSettings & { key: string };
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
    theme?: Partial<ThemeConfig>;
    settings?: AppSettings;
    timestamp: number;
  }>;
};
