export * from "./types";
export * from "./indexed-db";
export * from "./cache-layer";
export * from "./sync-engine";

import { cacheManager } from "./cache-layer";
import { syncEngine } from "./sync-engine";
import {
  SessionRecord,
  DBStoreMap,
  AllTimeStatsRecord,
} from "./types";

import { TodoItem } from "@/menus/todo/types";
import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";

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

  customBackgrounds: {
    getAll(): ThemeBackground[] {
      return cacheManager.getMemoryStore("customBackgrounds");
    },
    get(id: string): ThemeBackground | null {
      return cacheManager.getMemoryItem("customBackgrounds", id);
    },
    save(bg: ThemeBackground): void {
      cacheManager.setMemoryItem("customBackgrounds", bg.id, bg, true);
      syncEngine.queueChange("customBackgrounds", "create", bg.id, bg);
    },
    saveAll(bgs: ThemeBackground[]): void {
      cacheManager.setMemoryStore("customBackgrounds", bgs, true);
    },
    delete(id: string): void {
      cacheManager.deleteMemoryItem("customBackgrounds", id, true);
      syncEngine.queueChange("customBackgrounds", "delete", id);
    },
    clear(): void {
      cacheManager.clearMemoryStore("customBackgrounds");
    },
  },

  customPlaylists: {
    getAll(): Playlist[] {
      return cacheManager.getMemoryStore("customPlaylists");
    },
    get(id: string): Playlist | null {
      return cacheManager.getMemoryItem("customPlaylists", id);
    },
    save(playlist: Playlist): void {
      cacheManager.setMemoryItem(
        "customPlaylists",
        playlist.id,
        playlist,
        true,
      );
      syncEngine.queueChange("customPlaylists", "create", playlist.id, playlist);
    },
    saveAll(playlists: Playlist[]): void {
      cacheManager.setMemoryStore("customPlaylists", playlists, true);
    },
    delete(id: string): void {
      cacheManager.deleteMemoryItem("customPlaylists", id, true);
      syncEngine.queueChange("customPlaylists", "delete", id);
    },
    clear(): void {
      cacheManager.clearMemoryStore("customPlaylists");
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

  sync: syncEngine,
  flush: () => cacheManager.flushPending(),
};
