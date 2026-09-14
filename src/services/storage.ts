import { db, cacheManager } from "./db";
import { SessionRecord, AppSettings } from "./db/types";

export type { SessionRecord, AppSettings };

export const STORAGE_KEYS = {
  TIMER_STATE: "timer",
  SESSIONS_HISTORY: "history",
  THEME_CONFIG: "theme",
  TODOS: "todos",
  SETTINGS: "settings",
  DAILY_ROLLUPS: "daily_rollups",
  STATS_SUMMARY: "stats_summary",
} as const;

// Storage engine dispatch maps for IndexedDB-backed stores
const DB_GETTERS: Record<string, () => any> = {
  [STORAGE_KEYS.SESSIONS_HISTORY]: () => db.sessions.getAll(),
  [STORAGE_KEYS.TODOS]: () => db.todos.getAll(),
  [STORAGE_KEYS.DAILY_ROLLUPS]: () => db.dailyRollups.getAll(),
  [STORAGE_KEYS.STATS_SUMMARY]: () => db.statsSummary.get(),
};

const DB_SETTERS: Record<string, (val: any) => void> = {
  [STORAGE_KEYS.SESSIONS_HISTORY]: (value) =>
    Array.isArray(value) && db.sessions.saveAll(value),
  [STORAGE_KEYS.TODOS]: (value) =>
    Array.isArray(value) && db.todos.saveAll(value),
  [STORAGE_KEYS.DAILY_ROLLUPS]: (value) =>
    Array.isArray(value) && db.dailyRollups.saveAll(value),
  [STORAGE_KEYS.STATS_SUMMARY]: (value) =>
    typeof value === "object" && value !== null && db.statsSummary.save(value),
};

const DB_CLEARERS: Record<string, () => void> = {
  [STORAGE_KEYS.SESSIONS_HISTORY]: () => db.sessions.clear(),
  [STORAGE_KEYS.TODOS]: () => db.todos.clear(),
  [STORAGE_KEYS.DAILY_ROLLUPS]: () => db.dailyRollups.clear(),
  [STORAGE_KEYS.STATS_SUMMARY]: () => db.statsSummary.clear(),
};

/**
 * Storage adapter with in-memory caching and IndexedDB write-behind
 */
export const storageAdapter = {
  getItem<T>(key: string, fallback: T): T {
    try {
      if (DB_GETTERS[key]) {
        const item = DB_GETTERS[key]();

        if (Array.isArray(item)) {
          return item as T;
        }

        if (item !== null && item !== undefined) {
          return item as T;
        }
      }
      const raw =
        typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;

      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      if (DB_SETTERS[key]) {
        DB_SETTERS[key](value);

        return;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {}
  },

  removeItem(key: string): void {
    try {
      if (DB_CLEARERS[key]) {
        DB_CLEARERS[key]();

        return;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {}
  },

  clear(): void {
    try {
      Object.values(DB_CLEARERS).forEach((clearer) => clearer());
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
    } catch {}
  },

  flush(): Promise<void> {
    return cacheManager.flushPending();
  },
};
