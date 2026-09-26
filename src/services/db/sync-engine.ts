import {
  RemoteDatabaseProvider,
  SyncQueueItem,
  SyncStats,
  SyncableStoreName,
} from "./types";
import { cacheManager } from "./cache-layer";

/**
 * Reconciles incoming remote deltas with local records using Last-Write-Wins (LWW) & Tombstone preservation
 */
function reconcileEntityList<
  T extends {
    id: string;
    updatedAt?: number;
    createdAt?: number;
    isDeleted?: boolean;
  },
>(localList: T[], remoteList: T[], storeName?: SyncableStoreName): T[] {
  const map = new Map<string, T>();

  const hasRemoteItems = remoteList.some((r) => !r.isDeleted);

  // 1. Populate map with valid local records (omit demo welcome tasks if we have remote data)
  for (const item of localList) {
    if (hasRemoteItems && item.id.startsWith("cozify-welcome-task-")) {
      continue;
    }
    if (!item.isDeleted) {
      map.set(item.id, item);
    }
  }

  // 2. Apply remote records based on logical/clock timestamps
  for (const remoteItem of remoteList) {
    const localItem = map.get(remoteItem.id);

    if (!localItem) {
      if (!remoteItem.isDeleted) {
        map.set(remoteItem.id, remoteItem);
      }
    } else {
      const remoteTime = remoteItem.updatedAt || remoteItem.createdAt || 0;
      const localTime = localItem.updatedAt || localItem.createdAt || 0;

      // Remote wins if newer or if deleted remotely
      if (remoteItem.isDeleted) {
        if (remoteTime >= localTime) {
          map.delete(remoteItem.id);
        }
      } else if (remoteTime >= localTime) {
        map.set(remoteItem.id, remoteItem);
      }
    }
  }

  const result = Array.from(map.values()).filter((item) => !item.isDeleted);

  if (storeName === "todos" && typeof localStorage !== "undefined") {
    try {
      const rawOrder = localStorage.getItem("cozify_todo_order_ids");

      if (rawOrder) {
        const orderIds = JSON.parse(rawOrder);

        if (Array.isArray(orderIds) && orderIds.length > 0) {
          const orderMap = new Map<string, number>();

          orderIds.forEach((id: string, idx: number) => orderMap.set(id, idx));

          result.sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;

            if (indexA !== indexB) {
              return indexA - indexB;
            }

            return (b.createdAt || 0) - (a.createdAt || 0);
          });
        }
      }
    } catch {}
  }

  return result;
}

class RemoteSyncEngine {
  private provider: RemoteDatabaseProvider | null = null;
  private isSyncing = false;
  private hasCompletedInitialSync = false;
  private lastSyncedAt: number | null = null;
  private lastError: string | null = null;
  private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupAutoSync();
  }

  /**
   * Register online database provider (e.g. Supabase)
   */
  public registerProvider(provider: RemoteDatabaseProvider) {
    this.provider = provider;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getHasCompletedInitialSync(): boolean {
    return this.hasCompletedInitialSync;
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
   * Enqueue a mutation into the append-only outbox
   */
  public queueChange<T>(
    store: SyncableStoreName,
    action: "create" | "update" | "delete",
    entityId: string,
    payload?: T,
  ) {
    const validStores: SyncableStoreName[] = [
      "sessions",
      "todos",
      "customBackgrounds",
      "customPlaylists",
    ];

    if (!validStores.includes(store)) {
      return;
    }

    // If deleting, purge earlier pending creations/updates for the same entity
    if (action === "delete") {
      const existingQueue = cacheManager.getMemoryStore("syncQueue");

      for (const qItem of existingQueue) {
        if (qItem.store === store && qItem.entityId === entityId) {
          cacheManager.deleteMemoryItem("syncQueue", qItem.id, false);
        }
      }
    }

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
   * Ensures all genuine local/offline data is queued for cloud replication upon login
   */
  public promoteLocalDataToSyncQueue() {
    const queue = cacheManager.getMemoryStore("syncQueue");
    const queuedEntityIds = new Set(queue.map((q) => q.entityId));

    // 1. Sessions
    const sessions = cacheManager.getMemoryStore("sessions");

    for (const session of sessions) {
      if (!queuedEntityIds.has(session.id) && !session.isDeleted) {
        this.queueChange("sessions", "create", session.id, session);
      }
    }

    // 2. Todos - NEVER promote demo welcome tasks or deleted tasks
    const todos = cacheManager.getMemoryStore("todos");

    for (const todo of todos) {
      if (
        !queuedEntityIds.has(todo.id) &&
        !todo.isDeleted &&
        !todo.id.startsWith("cozify-welcome-task-")
      ) {
        this.queueChange("todos", "create", todo.id, todo);
      }
    }

    // 3. Custom Wallpapers
    const backgrounds = cacheManager.getMemoryStore("customBackgrounds");

    for (const bg of backgrounds) {
      if (!queuedEntityIds.has(bg.id) && !bg.isDeleted) {
        this.queueChange("customBackgrounds", "create", bg.id, bg);
      }
    }

    // 4. Custom Playlists
    const playlists = cacheManager.getMemoryStore("customPlaylists");

    for (const pl of playlists) {
      if (!queuedEntityIds.has(pl.id) && !pl.isDeleted) {
        this.queueChange("customPlaylists", "create", pl.id, pl);
      }
    }
  }

  /**
   * 4-Phase Pull-Before-Push Sync Protocol
   */
  public async syncWithRemote(): Promise<boolean> {
    this.lastError = null;

    if (!this.provider) {
      this.lastError = "Cloud database provider is not connected";

      return false;
    }

    if (this.isSyncing) {
      return false;
    }

    // Check network connectivity
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.lastError = "You are currently offline";

      return false;
    }

    this.isSyncing = true;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cozify_sync_start"));
    }

    try {
      await cacheManager.ensureAllInitialized();

      // 1. PHASE 1 & 2: INBOUND DELTA PULL & RECONCILIATION
      const pullTimestamp = this.lastSyncedAt || 0;
      const remoteData = await this.provider.pullChanges(pullTimestamp);

      if (remoteData) {
        if (remoteData.error) {
          this.lastError = remoteData.error;
        }

        if (remoteData.sessions !== undefined) {
          const local = cacheManager.getMemoryStore("sessions");
          const reconciled = reconcileEntityList(local, remoteData.sessions);

          cacheManager.setMemoryStore("sessions", reconciled, true);
        }

        if (remoteData.todos !== undefined) {
          const local = cacheManager.getMemoryStore("todos");
          const reconciled = reconcileEntityList(
            local,
            remoteData.todos,
            "todos",
          );

          cacheManager.setMemoryStore("todos", reconciled, true);
        }

        if (remoteData.customBackgrounds !== undefined) {
          const local = cacheManager.getMemoryStore("customBackgrounds");
          const reconciled = reconcileEntityList(
            local,
            remoteData.customBackgrounds,
          );

          cacheManager.setMemoryStore("customBackgrounds", reconciled, true);
        }

        if (remoteData.customPlaylists !== undefined) {
          const local = cacheManager.getMemoryStore("customPlaylists");
          const reconciled = reconcileEntityList(
            local,
            remoteData.customPlaylists,
          );

          cacheManager.setMemoryStore("customPlaylists", reconciled, true);
        }

        this.lastSyncedAt = remoteData.timestamp || Date.now();
      }

      // 2. Promote any remaining local offline items to outbox & flush to IDB
      this.promoteLocalDataToSyncQueue();
      await cacheManager.flushPending();

      // 3. Clean up any invalid or legacy items from outbox queue
      const existingQueue = cacheManager.getMemoryStore("syncQueue");
      const validStores = new Set<SyncableStoreName>([
        "sessions",
        "todos",
        "customBackgrounds",
        "customPlaylists",
      ]);

      for (const item of existingQueue) {
        if (!item || !validStores.has(item.store)) {
          cacheManager.deleteMemoryItem("syncQueue", item.id, false);
        }
      }

      // 4. PHASE 3 & 4: OUTBOUND MUTATION PUSH & EVICTION
      let queue = cacheManager.getMemoryStore("syncQueue");
      let pushSuccess = true;

      while (queue.length > 0) {
        const batch = queue.slice(0, 50);
        const result = await this.provider.pushBatch(batch);

        if (result.error) {
          this.lastError = result.error;
        }

        if (result.success && result.syncedIds.length > 0) {
          for (const syncedId of result.syncedIds) {
            cacheManager.deleteMemoryItem("syncQueue", syncedId, true);
          }
          queue = cacheManager.getMemoryStore("syncQueue");
        } else {
          pushSuccess = false;
          break;
        }
      }

      // 5. Notify UI components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cozify_remote_synced"));
        window.dispatchEvent(new CustomEvent("cozify_stats_updated"));
        window.dispatchEvent(new Event("storage"));
      }

      return pushSuccess && queue.length === 0;
    } catch (err: any) {
      this.lastError =
        err?.message || "Sync protocol encountered an unexpected error";
      // eslint-disable-next-line no-console
      console.error("Sync protocol error:", err);

      return false;
    } finally {
      this.isSyncing = false;
      this.hasCompletedInitialSync = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cozify_sync_end"));
      }
    }
  }

  public resetEngine() {
    this.provider = null;
    this.lastSyncedAt = 0;
    this.lastError = null;
    this.isSyncing = false;
    this.hasCompletedInitialSync = false;
  }

  /**
   * Periodic background sync (every 60 seconds)
   */
  private setupAutoSync() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      this.syncWithRemote();
    });

    this.syncIntervalTimer = setInterval(() => {
      this.syncWithRemote();
    }, 60 * 1000);
  }

  public dispose() {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }
}

export const syncEngine = new RemoteSyncEngine();
