import { ThemeConfig } from "@/config/themes";
import { TodoItem } from "@/components/todo/types";

export interface SessionRecord {
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
}

export interface AppSettings {
  todo?: {
    mode?: "minimal" | "detailed";
  };
  [key: string]: unknown;
}

export interface DBStoreMap {
  sessions: SessionRecord;
  todos: TodoItem;
  theme: Partial<ThemeConfig> & { key: string };
  timer: Record<string, unknown> & { key: string };
  settings: AppSettings & { key: string };
  syncQueue: SyncQueueItem;
}

export type StoreName = keyof DBStoreMap;

export interface SyncQueueItem {
  id: string;
  store: StoreName;
  action: "create" | "update" | "delete";
  entityId: string;
  payload?: unknown;
  timestamp: number;
}

export interface SyncStats {
  pendingCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  providerName?: string;
}

/**
 * Interface for online cloud providers (e.g. Supabase, MongoDB, Firebase)
 */
export interface RemoteDatabaseProvider {
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
}
