import { cacheManager } from "./cache-layer";
import { syncEngine } from "./sync-engine";
import {
  SessionRecord,
  DailyRollupRecord,
  AllTimeStatsRecord,
  DBStoreMap,
  SyncableStoreName,
  EntityRepository,
} from "./types";

import { TodoItem } from "@/menus/todo/types";
import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";

/**
 * Generic factory for syncable, tombstone-aware domain entity repositories.
 * Handles automatic timestamp assignment, outbox mutation queueing, and soft deletion.
 */
function createEntityRepository<K extends SyncableStoreName>(
  storeName: K,
  mirrorToLocalStorage = true,
): EntityRepository<DBStoreMap[K]> {
  type T = DBStoreMap[K];

  return {
    getAll(): T[] {
      return (cacheManager.getMemoryStore(storeName) as unknown as T[]).filter(
        (item: any) => !item.isDeleted,
      );
    },

    get(id: string): T | null {
      const item = cacheManager.getMemoryItem(
        storeName,
        id,
      ) as unknown as T | null;

      return item && !(item as any).isDeleted ? item : null;
    },

    save(item: T): void {
      const withTimestamp = {
        ...item,
        isDeleted: false,
        updatedAt: (item as any).updatedAt || Date.now(),
      } as T;

      cacheManager.setMemoryItem(
        storeName,
        (item as any).id,
        withTimestamp,
        mirrorToLocalStorage,
      );

      if (!(item as any).id?.startsWith("cozify-welcome-task-")) {
        syncEngine.queueChange(
          storeName,
          "create",
          (item as any).id,
          withTimestamp,
        );
      }
    },

    saveAll(items: T[]): void {
      cacheManager.setMemoryStore(
        storeName,
        items as any,
        mirrorToLocalStorage,
      );
    },

    delete(id: string): void {
      const existing = cacheManager.getMemoryItem(
        storeName,
        id,
      ) as unknown as T | null;

      if (existing) {
        const tombstone = {
          ...existing,
          isDeleted: true,
          updatedAt: Date.now(),
        } as T;

        cacheManager.setMemoryItem(
          storeName,
          id,
          tombstone,
          mirrorToLocalStorage,
        );
      }

      if (!id.startsWith("cozify-welcome-task-")) {
        syncEngine.queueChange(storeName, "delete", id);
      }
    },

    clear(): void {
      cacheManager.clearMemoryStore(storeName);
    },
  };
}

// Instantiate base entity stores
const baseSessions = createEntityRepository("sessions", true);
const baseTodos = createEntityRepository("todos", true);
const baseCustomBackgrounds = createEntityRepository("customBackgrounds", true);
const baseCustomPlaylists = createEntityRepository("customPlaylists", true);

/**
 * Focus & Pomodoro sessions repository with specialized filters
 */
export const sessionsRepository = {
  ...baseSessions,
  getByTag(tag: string): SessionRecord[] {
    return this.getAll().filter(
      (session) => session.tag?.toLowerCase() === tag.toLowerCase(),
    );
  },
  getByDateRange(startMs: number, endMs: number): SessionRecord[] {
    return this.getAll().filter(
      (session) => session.createdAt >= startMs && session.createdAt <= endMs,
    );
  },
};

/**
 * Task / Todo repository with specialized status and tag filters
 */
export const todosRepository = {
  ...baseTodos,
  getActive(): TodoItem[] {
    return this.getAll().filter((todo) => !todo.completed && !todo.archived);
  },
  getCompleted(): TodoItem[] {
    return this.getAll().filter((todo) => todo.completed && !todo.archived);
  },
  getByTag(tag: string): TodoItem[] {
    return this.getAll().filter(
      (todo) => todo.tag?.toLowerCase() === tag.toLowerCase(),
    );
  },
};

/**
 * Custom uploaded wallpapers repository
 */
export const customBackgroundsRepository: EntityRepository<ThemeBackground> =
  baseCustomBackgrounds;

/**
 * Custom user playlists repository
 */
export const customPlaylistsRepository: EntityRepository<Playlist> =
  baseCustomPlaylists;

/**
 * Daily rollup statistics repository
 */
export const dailyRollupsRepository = {
  getAll(): DailyRollupRecord[] {
    return cacheManager.getMemoryStore("dailyRollups");
  },
  get(date: string): DailyRollupRecord | null {
    return cacheManager.getMemoryItem("dailyRollups", date);
  },
  save(record: DailyRollupRecord): void {
    const withTimestamp = { ...record, updatedAt: Date.now() };

    cacheManager.setMemoryItem(
      "dailyRollups",
      record.date,
      withTimestamp,
      true,
    );
  },
  saveAll(records: DailyRollupRecord[]): void {
    cacheManager.setMemoryStore("dailyRollups", records, true);
  },
  delete(date: string): void {
    cacheManager.deleteMemoryItem("dailyRollups", date, true);
  },
  clear(): void {
    cacheManager.clearMemoryStore("dailyRollups");
  },
};

/**
 * Lifetime summary statistics repository
 */
export const statsSummaryRepository = {
  get(): AllTimeStatsRecord | null {
    return cacheManager.getMemoryItem("statsSummary", "summary");
  },
  save(stats: AllTimeStatsRecord): void {
    const withKey = { ...stats, key: "summary", updatedAt: Date.now() };

    cacheManager.setMemoryItem("statsSummary", "summary", withKey, true);
  },
  clear(): void {
    cacheManager.clearMemoryStore("statsSummary");
  },
};
