export * from "./types";
export * from "./indexed-db";
export * from "./cache-layer";
export * from "./sync-engine";

import { cacheManager } from "./cache-layer";
import { syncEngine } from "./sync-engine";
import {
  SessionRecord,
  AppSettings,
  DBStoreMap,
  AllTimeStatsRecord,
} from "./types";

import { TodoItem } from "@/menus/todo/types";
import { ThemeConfig } from "@/config/themes";

/**
 * High-level Database & Repository interface for Cozify
 */
export const db = {
  sessions: {
    getAll(): SessionRecord[] {
      return cacheManager.getMemoryStore("sessions");
    },
    get(id: string): SessionRecord | null {
      return cacheManager.getMemoryItem("sessions", id);
    },
    save(session: SessionRecord): void {
      const withTimestamp = { ...session, updatedAt: Date.now() };

      cacheManager.setMemoryItem("sessions", session.id, withTimestamp, true);
      syncEngine.queueChange("sessions", "create", session.id, withTimestamp);
    },
    saveAll(sessions: SessionRecord[]): void {
      cacheManager.setMemoryStore("sessions", sessions, true);
    },
    delete(id: string): void {
      cacheManager.deleteMemoryItem("sessions", id, true);
      syncEngine.queueChange("sessions", "delete", id);
    },
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
    clear(): void {
      cacheManager.clearMemoryStore("sessions");
    },
  },

  todos: {
    getAll(): TodoItem[] {
      return cacheManager.getMemoryStore("todos");
    },
    get(id: string): TodoItem | null {
      return cacheManager.getMemoryItem("todos", id);
    },
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
    save(todo: TodoItem): void {
      cacheManager.setMemoryItem("todos", todo.id, todo, false);
      syncEngine.queueChange("todos", "create", todo.id, todo);
    },
    saveAll(todos: TodoItem[]): void {
      cacheManager.setMemoryStore("todos", todos, false);
    },
    delete(id: string): void {
      cacheManager.deleteMemoryItem("todos", id, true);
      syncEngine.queueChange("todos", "delete", id);
    },
    clear(): void {
      cacheManager.clearMemoryStore("todos");
    },
  },

  dailyRollups: {
    getAll(): DBStoreMap["dailyRollups"][] {
      return cacheManager.getMemoryStore("dailyRollups");
    },
    get(date: string): DBStoreMap["dailyRollups"] | null {
      return cacheManager.getMemoryItem("dailyRollups", date);
    },
    save(record: DBStoreMap["dailyRollups"]): void {
      const withTimestamp = { ...record, updatedAt: Date.now() };

      cacheManager.setMemoryItem("dailyRollups", record.date, withTimestamp, true);
      syncEngine.queueChange("dailyRollups", "update", record.date, withTimestamp);
    },
    saveAll(records: DBStoreMap["dailyRollups"][]): void {
      cacheManager.setMemoryStore("dailyRollups", records, true);
    },
    delete(date: string): void {
      cacheManager.deleteMemoryItem("dailyRollups", date, true);
      syncEngine.queueChange("dailyRollups", "delete", date);
    },
    clear(): void {
      cacheManager.clearMemoryStore("dailyRollups");
    },
  },

  statsSummary: {
    get(): DBStoreMap["statsSummary"] | null {
      const item = cacheManager.getMemoryItem("statsSummary", "summary");

      return item || null;
    },
    save(summary: AllTimeStatsRecord): void {
      const withKey: DBStoreMap["statsSummary"] = {
        ...summary,
        key: "summary",
        updatedAt: Date.now(),
      };

      cacheManager.setMemoryItem("statsSummary", "summary", withKey, true);
      syncEngine.queueChange("statsSummary", "update", "summary", withKey);
    },
    clear(): void {
      cacheManager.clearMemoryStore("statsSummary");
    },
  },

  theme: {
    get(): Partial<ThemeConfig> | null {
      const item = cacheManager.getMemoryItem("theme", "current");

      return item || null;
    },
    save(theme: Partial<ThemeConfig>): void {
      cacheManager.setMemoryItem(
        "theme",
        "current",
        { ...theme, key: "current" },
        false,
      );
    },
    clear(): void {
      cacheManager.clearMemoryStore("theme");
    },
  },

  timer: {
    get(): Record<string, unknown> | null {
      const item = cacheManager.getMemoryItem("timer", "current");

      return item || null;
    },
    save(timer: Record<string, unknown>): void {
      cacheManager.setMemoryItem(
        "timer",
        "current",
        { ...timer, key: "current" },
        false,
      );
    },
    clear(): void {
      cacheManager.clearMemoryStore("timer");
    },
  },

  settings: {
    get(): AppSettings {
      const item = cacheManager.getMemoryItem("settings", "current");

      return item || {};
    },
    save(settings: AppSettings): void {
      cacheManager.setMemoryItem(
        "settings",
        "current",
        { ...settings, key: "current" },
        false,
      );
    },
    clear(): void {
      cacheManager.clearMemoryStore("settings");
    },
  },

  sync: syncEngine,
  flush: () => cacheManager.flushPending(),
};
