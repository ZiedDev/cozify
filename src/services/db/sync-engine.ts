import {
  RemoteDatabaseProvider,
  SyncQueueItem,
  SyncStats,
  StoreName,
} from "./types";
import { cacheManager } from "./cache-layer";

class RemoteSyncEngine {
  private provider: RemoteDatabaseProvider | null = null;
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupAutoSync();
  }

  /**
   * Register online database provider (e.g. Supabase, MongoDB, Firebase)
   */
  public registerProvider(provider: RemoteDatabaseProvider) {
    this.provider = provider;
  }

  public getStats(): SyncStats {
    const queue = cacheManager.getMemoryStore("syncQueue");

    return {
      pendingCount: queue.length,
      lastSyncedAt: this.lastSyncedAt,
      isSyncing: this.isSyncing,
      providerName: this.provider?.name,
    };
  }

  /**
   * Enqueue a mutation for offline-first replication
   */
  public queueChange<T>(
    store: StoreName,
    action: "create" | "update" | "delete",
    entityId: string,
    payload?: T,
  ) {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      store,
      action,
      entityId,
      payload,
      timestamp: Date.now(),
    };

    cacheManager.setMemoryItem("syncQueue", item.id, item, false);
  }

  /**
   * Performs an optimized batched sync to conserve quota and network bandwidth
   */
  public async syncWithRemote(): Promise<boolean> {
    if (!this.provider || this.isSyncing) return false;

    // Check network connectivity
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }

    this.isSyncing = true;

    try {
      // 1. Flush any pending local writes to DB first
      await cacheManager.flushPending();

      // 2. Fetch pending local mutations from sync queue
      const queue = cacheManager.getMemoryStore("syncQueue");

      if (queue.length > 0) {
        // Send in batches of 50 to avoid request payload limits
        const batch = queue.slice(0, 50);
        const result = await this.provider.pushBatch(batch);

        if (result.success && result.syncedIds.length > 0) {
          for (const syncedId of result.syncedIds) {
            cacheManager.deleteMemoryItem("syncQueue", syncedId, true);
          }
        }
      }

      // 3. Pull remote updates since last sync timestamp
      const pullTimestamp = this.lastSyncedAt || 0;
      const remoteData = await this.provider.pullChanges(pullTimestamp);

      if (remoteData) {
        if (remoteData.sessions) {
          cacheManager.setMemoryStore("sessions", remoteData.sessions, true);
        }
        if (remoteData.todos) {
          cacheManager.setMemoryStore("todos", remoteData.todos, true);
        }
        this.lastSyncedAt = remoteData.timestamp || Date.now();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cozify_remote_synced"));
          window.dispatchEvent(new Event("storage"));
        }
      }

      return true;
    } catch {
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Periodic background sync that respects quota (runs at a gentle interval like 5 mins)
   */
  private setupAutoSync() {
    if (typeof window === "undefined") return;

    // Sync when coming back online
    window.addEventListener("online", () => {
      this.syncWithRemote();
    });

    // Gentle sync interval (every 5 minutes)
    this.syncIntervalTimer = setInterval(
      () => {
        this.syncWithRemote();
      },
      5 * 60 * 1000,
    );
  }

  public dispose() {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }
}

export const syncEngine = new RemoteSyncEngine();
