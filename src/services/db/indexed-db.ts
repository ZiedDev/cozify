import Dexie, { type EntityTable } from "dexie";
import {
  StoreName,
  DBStoreMap,
  SessionRecord,
  AppSettings,
  SyncQueueItem,
} from "./types";
import { TodoItem } from "@/menus/todo/types";
import { ThemeConfig } from "@/config/themes";

const DB_NAME = "cozify_idb";
const DB_VERSION = 1;

export class CozifyDexieDB extends Dexie {
  sessions!: EntityTable<SessionRecord, "id">;
  todos!: EntityTable<TodoItem, "id">;
  theme!: EntityTable<Partial<ThemeConfig> & { key: string }, "key">;
  timer!: EntityTable<Record<string, unknown> & { key: string }, "key">;
  settings!: EntityTable<AppSettings & { key: string }, "key">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      sessions: "id, createdAt, tag",
      todos: "id, createdAt, completed, tag, dueDate",
      theme: "key",
      timer: "key",
      settings: "key",
      syncQueue: "id, timestamp",
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
