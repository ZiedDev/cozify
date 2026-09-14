import {
  sessionsRepository,
  todosRepository,
  customBackgroundsRepository,
  customPlaylistsRepository,
  dailyRollupsRepository,
  statsSummaryRepository,
} from "./repositories";

export * from "./types";
export * from "./indexed-db";
export * from "./cache-layer";
export * from "./sync-engine";
export * from "./repositories";

/**
 * Unified Database & Repository interface for Cozify.
 * Provides high-speed, offline-first access backed by in-memory cache, IndexedDB write-behind,
 * and automatic cloud synchronization.
 */
export const db = {
  sessions: sessionsRepository,
  todos: todosRepository,
  customBackgrounds: customBackgroundsRepository,
  customPlaylists: customPlaylistsRepository,
  dailyRollups: dailyRollupsRepository,
  statsSummary: statsSummaryRepository,
};
