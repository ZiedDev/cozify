import { StoreName, DBStoreMap } from "./types";
import { idb } from "./indexed-db";

const STORES: StoreName[] = [
  "sessions",
  "todos",
  "theme",
  "timer",
  "settings",
  "syncQueue",
];

class DatabaseCacheManager {
  private cache = new Map<StoreName, Map<string, unknown>>();
  private initializedStores = new Set<StoreName>();
  private pendingWrites = new Map<StoreName, Map<string, unknown | null>>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.preloadAllFromLocalStorage();
    this.setupUnloadHandler();
    this.initAllAsync();
  }

  private preloadAllFromLocalStorage() {
    for (const store of STORES) {
      this.migrateFromLocalStorage(store);
    }
  }

  private initAllAsync() {
    for (const store of STORES) {
      this.initStore(store).catch(() => {
        // Silently handle offline/IDB errors
      });
    }
  }

  private setupUnloadHandler() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flushPendingSync();
      });
    }
  }

  private getStoreMap<K extends StoreName>(
    storeName: K,
  ): Map<string, DBStoreMap[K]> {
    let map = this.cache.get(storeName);

    if (!map) {
      map = new Map<string, unknown>();
      this.cache.set(storeName, map);
    }

    return map as Map<string, DBStoreMap[K]>;
  }

  /**
   * Initializes store in memory from IDB or localStorage bootstrap
   */
  public async initStore<K extends StoreName>(storeName: K): Promise<void> {
    if (this.initializedStores.has(storeName)) return;

    const storeMap = this.getStoreMap(storeName);

    // 1. Try reading from IndexedDB
    try {
      const records = await idb.getAll(storeName);

      if (records && records.length > 0) {
        storeMap.clear();
        for (const item of records) {
          const key =
            (item as { id?: string; key?: string }).id ||
            (item as { key?: string }).key ||
            "default";

          storeMap.set(key, item);
        }
      } else {
        // 2. Migration fallback from localStorage if IDB is fresh
        this.migrateFromLocalStorage(storeName);
      }
    } catch {
      this.migrateFromLocalStorage(storeName);
    }

    this.initializedStores.add(storeName);
  }

  /**
   * One-time transparent migration from legacy localStorage keys to IDB
   */
  public migrateFromLocalStorage<K extends StoreName>(storeName: K) {
    if (typeof localStorage === "undefined") return;

    const legacyKeyMap: Record<StoreName, string> = {
      sessions: "history",
      todos: "todos",
      theme: "theme",
      timer: "timer",
      settings: "settings",
      syncQueue: "cozify_sync_queue",
    };

    const localKey = legacyKeyMap[storeName];

    if (!localKey) return;

    try {
      const raw = localStorage.getItem(localKey);

      if (!raw) return;

      const parsed = JSON.parse(raw);
      const storeMap = this.getStoreMap(storeName);

      if (Array.isArray(parsed)) {
        storeMap.clear();
        for (const item of parsed) {
          const key = item.id || `item_${Date.now()}_${Math.random()}`;

          storeMap.set(key, item);
        }
        idb.putBatch(storeName, parsed);
      } else if (parsed && typeof parsed === "object") {
        const itemWithKey = { ...parsed, key: "current" };

        storeMap.set("current", itemWithKey as DBStoreMap[K]);
        idb.put(storeName, itemWithKey as DBStoreMap[K]);
      }
    } catch {
      // Ignore parse failure
    }
  }

  /**
   * Fast synchronous read from in-memory cache (Read-Through)
   */
  public getMemoryStore<K extends StoreName>(storeName: K): DBStoreMap[K][] {
    if (!this.cache.has(storeName)) {
      this.migrateFromLocalStorage(storeName);
    }

    const storeMap = this.getStoreMap(storeName);

    return Array.from(storeMap.values());
  }

  public getMemoryItem<K extends StoreName>(
    storeName: K,
    key: string,
  ): DBStoreMap[K] | null {
    if (!this.cache.has(storeName)) {
      this.migrateFromLocalStorage(storeName);
    }

    const storeMap = this.getStoreMap(storeName);

    return storeMap.get(key) || null;
  }

  /**
   * Fast in-memory write with debounced batch flush (Write-Behind)
   */
  public setMemoryItem<K extends StoreName>(
    storeName: K,
    key: string,
    value: DBStoreMap[K],
    immediate = false,
  ): void {
    const storeMap = this.getStoreMap(storeName);

    storeMap.set(key, value);

    // Synchronously mirror single-item stores to localStorage for instant reload availability
    this.mirrorToLocalStorage(storeName, value);

    // Queue for write-behind to IndexedDB
    if (!this.pendingWrites.has(storeName)) {
      this.pendingWrites.set(storeName, new Map());
    }

    this.pendingWrites.get(storeName)!.set(key, value);

    if (immediate) {
      this.flushPending();
    } else {
      this.scheduleDebouncedFlush();
    }
  }

  public setMemoryStore<K extends StoreName>(
    storeName: K,
    items: DBStoreMap[K][],
    immediate = false,
  ): void {
    const storeMap = this.getStoreMap(storeName);

    storeMap.clear();

    for (const item of items) {
      const key =
        (item as { id?: string; key?: string }).id ||
        (item as { key?: string }).key ||
        "default";

      storeMap.set(key, item);
    }

    // Queue entire store replacement
    if (!this.pendingWrites.has(storeName)) {
      this.pendingWrites.set(storeName, new Map());
    }

    const pending = this.pendingWrites.get(storeName)!;

    for (const [k, v] of storeMap.entries()) {
      pending.set(k, v);
    }

    // Mirror to legacy localStorage for instant cross-tab compatibility
    this.mirrorToLocalStorage(storeName, items);

    if (immediate) {
      this.flushPending();
    } else {
      this.scheduleDebouncedFlush();
    }
  }

  public deleteMemoryItem<K extends StoreName>(
    storeName: K,
    key: string,
    immediate = false,
  ): void {
    const storeMap = this.getStoreMap(storeName);

    storeMap.delete(key);

    if (
      storeName === "timer" ||
      storeName === "theme" ||
      storeName === "settings"
    ) {
      this.mirrorToLocalStorage(storeName, null as any);
    } else {
      this.mirrorToLocalStorage(storeName, Array.from(storeMap.values()));
    }

    if (!this.pendingWrites.has(storeName)) {
      this.pendingWrites.set(storeName, new Map());
    }

    this.pendingWrites.get(storeName)!.set(key, null);

    if (immediate) {
      this.flushPending();
    } else {
      this.scheduleDebouncedFlush();
    }
  }

  public clearMemoryStore<K extends StoreName>(storeName: K): void {
    const storeMap = this.getStoreMap(storeName);

    storeMap.clear();
    this.mirrorToLocalStorage(storeName, null as any);

    if (!this.pendingWrites.has(storeName)) {
      this.pendingWrites.set(storeName, new Map());
    }

    // Mark all as null for IDB deletion
    idb.clear(storeName);
  }

  private scheduleDebouncedFlush() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushPending();
    }, 150); // 150ms debounce window combines burst updates
  }

  public async flushPending(): Promise<void> {
    if (this.pendingWrites.size === 0) return;

    const entries = Array.from(this.pendingWrites.entries());

    this.pendingWrites.clear();

    for (const [storeName, itemMap] of entries) {
      const itemsToPut: DBStoreMap[StoreName][] = [];
      const keysToDelete: string[] = [];

      for (const [key, value] of itemMap.entries()) {
        if (value === null) {
          keysToDelete.push(key);
        } else {
          itemsToPut.push(value as DBStoreMap[StoreName]);
        }
      }

      if (itemsToPut.length > 0) {
        await idb.putBatch(storeName, itemsToPut);
      }

      for (const k of keysToDelete) {
        await idb.delete(storeName, k);
      }
    }
  }

  private flushPendingSync() {
    if (this.pendingWrites.size === 0) return;

    for (const storeName of this.pendingWrites.keys()) {
      const storeMap = this.cache.get(storeName);

      if (storeMap) {
        const items = Array.from(
          storeMap.values(),
        ) as DBStoreMap[typeof storeName][];

        this.mirrorToLocalStorage(storeName, items);
      }
    }
  }

  private mirrorToLocalStorage<K extends StoreName>(
    storeName: K,
    data: DBStoreMap[K][] | DBStoreMap[K] | null,
  ) {
    if (typeof localStorage === "undefined") return;

    const legacyKeyMap: Record<StoreName, string> = {
      sessions: "history",
      todos: "todos",
      theme: "theme",
      timer: "timer",
      settings: "settings",
      syncQueue: "cozify_sync_queue",
    };

    const key = legacyKeyMap[storeName];

    if (!key) return;

    try {
      if (
        storeName === "theme" ||
        storeName === "timer" ||
        storeName === "settings"
      ) {
        const item = Array.isArray(data) ? data[0] : data;

        if (item) {
          localStorage.setItem(key, JSON.stringify(item));
        } else {
          localStorage.removeItem(key);
        }
      } else {
        if (data) {
          localStorage.setItem(key, JSON.stringify(data));
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Storage quota exceeded
    }
  }
}

export const cacheManager = new DatabaseCacheManager();
