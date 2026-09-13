import Dexie, { type EntityTable } from "dexie";

import {
  StoreName,
  DBStoreMap,
  SessionRecord,
  SyncQueueItem,
} from "./types";

import { TodoItem } from "@/menus/todo/types";
import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";

export const DB_NAME = "cozify_idb";
export const DB_VERSION = 4;

export class CozifyDexieDB extends Dexie {
  sessions!: EntityTable<SessionRecord, "id">;
  todos!: EntityTable<TodoItem, "id">;
  customBackgrounds!: EntityTable<ThemeBackground, "id">;
  customPlaylists!: EntityTable<Playlist, "id">;
  dailyRollups!: EntityTable<DBStoreMap["dailyRollups"], "date">;
  statsSummary!: EntityTable<DBStoreMap["statsSummary"], "key">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super(DB_NAME);
    // Legacy Version 1 schema
    this.version(1).stores({
      sessions: "id, createdAt, tag",
      todos: "id, createdAt, completed, tag, dueDate",
      theme: "key",
      timer: "key",
      settings: "key",
      syncQueue: "id, timestamp",
    });

    // Version 2: Reworked schemas with compound indexes for fast date-range, priority, and completion queries
    this.version(2).stores({
      sessions: "id, createdAt, tag, focusMinutes, [tag+createdAt]",
      todos:
        "id, createdAt, completed, tag, dueDate, priority, archived, [completed+dueDate], [completed+priority]",
      theme: "key",
      timer: "key",
      settings: "key",
      syncQueue: "id, timestamp, store, action",
    });

    // Version 3: Incremental rollups and pre-computed stats summaries
    this.version(3).stores({
      sessions: "id, createdAt, tag, focusMinutes, [tag+createdAt]",
      todos:
        "id, createdAt, completed, tag, dueDate, priority, archived, [completed+dueDate], [completed+priority]",
      dailyRollups: "date, updatedAt",
      statsSummary: "key",
      theme: "key",
      timer: "key",
      settings: "key",
      syncQueue: "id, timestamp, store, action",
    });

    // Version 4: Pure persistent & syncable tables only. Dropped device-local tables.
    this.version(4).stores({
      sessions: "id, createdAt, tag, focusMinutes, [tag+createdAt]",
      todos:
        "id, createdAt, completed, tag, dueDate, priority, archived, [completed+dueDate], [completed+priority]",
      customBackgrounds: "id, name",
      customPlaylists: "id, title, platform",
      dailyRollups: "date, updatedAt",
      statsSummary: "key",
      syncQueue: "id, timestamp, store, action",
      // Drop device-local tables from IDB
      theme: null,
      timer: null,
      settings: null,
    });
  }
}

export const dexieDb = new CozifyDexieDB();

/**
 * Standard IDB adapter delegating directly to Dexie.
 * Eliminates custom IDB transaction boilerplate while preserving 100% backward compatibility.
 */
export const idb = {
  getAll: async <K extends StoreName>(
    storeName: K,
  ): Promise<DBStoreMap[K][]> => {
    try {
      return (await dexieDb.table(storeName).toArray()) as DBStoreMap[K][];
    } catch {
      return [];
    }
  },

  get: async <K extends StoreName>(
    storeName: K,
    key: IDBValidKey,
  ): Promise<DBStoreMap[K] | null> => {
    try {
      const res = await dexieDb.table(storeName).get(key as any);

      return (res as DBStoreMap[K]) || null;
    } catch {
      return null;
    }
  },

  put: async <K extends StoreName>(
    storeName: K,
    value: DBStoreMap[K],
  ): Promise<void> => {
    try {
      await dexieDb.table(storeName).put(value);
    } catch {}
  },

  putBatch: async <K extends StoreName>(
    storeName: K,
    values: DBStoreMap[K][],
  ): Promise<void> => {
    if (!values.length) return;
    try {
      await dexieDb.table(storeName).bulkPut(values);
    } catch {}
  },

  delete: async <K extends StoreName>(
    storeName: K,
    key: IDBValidKey,
  ): Promise<void> => {
    try {
      await dexieDb.table(storeName).delete(key as any);
    } catch {}
  },

  clear: async <K extends StoreName>(storeName: K): Promise<void> => {
    try {
      await dexieDb.table(storeName).clear();
    } catch {}
  },
};
