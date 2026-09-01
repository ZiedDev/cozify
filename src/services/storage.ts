import { db, cacheManager } from "./db";
import { SessionRecord, AppSettings } from "./db/types";

export type { SessionRecord, AppSettings };

export const STORAGE_KEYS = {
  TIMER_STATE: "timer",
  SESSIONS_HISTORY: "history",
  THEME_CONFIG: "theme",
  TODOS: "todos",
  SETTINGS: "settings",
} as const;

/**
 * Storage adapter with in-memory caching and IndexedDB write-behind
 */
export const storageAdapter = {
  getItem<T>(key: string, fallback: T): T {
    try {
      if (key === STORAGE_KEYS.SESSIONS_HISTORY) {
        const items = db.sessions.getAll();

        return (items.length > 0 ? items : fallback) as T;
      }
      if (key === STORAGE_KEYS.TODOS) {
        const items = db.todos.getAll();

        return (items.length > 0 ? items : fallback) as T;
      }
      if (key === STORAGE_KEYS.THEME_CONFIG) {
        const item = db.theme.get();

        return (item !== null ? item : fallback) as T;
      }
      if (key === STORAGE_KEYS.TIMER_STATE) {
        const item = db.timer.get();

        return (item !== null ? item : fallback) as T;
      }
      if (key === STORAGE_KEYS.SETTINGS) {
        const item = db.settings.get();

        return (item !== null ? item : fallback) as T;
      }

      // Generic fallback for minor keys (e.g. cozify_todo_filter, cozify_stats_range)
      const raw =
        typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;

      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      if (key === STORAGE_KEYS.SESSIONS_HISTORY && Array.isArray(value)) {
        db.sessions.saveAll(value as SessionRecord[]);

        return;
      }
      if (key === STORAGE_KEYS.TODOS && Array.isArray(value)) {
        db.todos.saveAll(value as any);

        return;
      }
      if (key === STORAGE_KEYS.THEME_CONFIG && typeof value === "object") {
        db.theme.save(value as any);

        return;
      }
      if (key === STORAGE_KEYS.TIMER_STATE && typeof value === "object") {
        db.timer.save(value as any);

        return;
      }
      if (key === STORAGE_KEYS.SETTINGS && typeof value === "object") {
        db.settings.save(value as any);

        return;
      }

      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Storage quota exceeded or disabled
    }
  },

  removeItem(key: string): void {
    try {
      if (key === STORAGE_KEYS.SESSIONS_HISTORY) {
        db.sessions.clear();

        return;
      }
      if (key === STORAGE_KEYS.TODOS) {
        db.todos.clear();

        return;
      }
      if (key === STORAGE_KEYS.THEME_CONFIG) {
        db.theme.clear();

        return;
      }
      if (key === STORAGE_KEYS.TIMER_STATE) {
        db.timer.clear();

        return;
      }
      if (key === STORAGE_KEYS.SETTINGS) {
        db.settings.clear();

        return;
      }

      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage disabled
    }
  },

  clear(): void {
    try {
      db.sessions.clear();
      db.todos.clear();
      db.theme.clear();
      db.timer.clear();
      db.settings.clear();
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
    } catch {
      // Storage disabled
    }
  },

  flush(): Promise<void> {
    return cacheManager.flushPending();
  },
};
