import {
  RemoteDatabaseProvider,
  SyncQueueItem,
  SessionRecord,
} from "../db/types";

import { supabase } from "./client";

import { TodoItem } from "@/menus/todo/types";
import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";

/**
 * Safe timestamp parser handling numeric milliseconds and ISO strings
 */
function parseTimestamp(val: unknown, fallback: number = Date.now()): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = Date.parse(val);

    if (!isNaN(parsed)) return parsed;
    const num = Number(val);

    if (!isNaN(num)) return num;
  }

  return fallback;
}

// Transform helpers between camelCase app types and snake_case Postgres columns
function sessionToRow(session: SessionRecord, userId?: string) {
  const now = Date.now();
  const createdAt = parseTimestamp(session.createdAt, now);
  const updatedAt = parseTimestamp(session.updatedAt, createdAt);

  return {
    id: session.id,
    user_id: userId,
    title: session.title || "Focus Session",
    tag: session.tag || null,
    cycles_completed: session.cyclesCompleted ?? session.sprintsCompleted ?? 0,
    target_cycles: session.targetCycles ?? session.targetSprints ?? 0,
    focus_minutes: Number(session.focusMinutes) || 0,
    overtime_minutes: session.overtimeMinutes ?? 0,
    overtime_seconds: session.overtimeSeconds ?? 0,
    notes: session.notes || null,
    is_deleted: Boolean(session.isDeleted),
    version: session.version || 1,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function rowToSession(row: any): SessionRecord {
  const now = Date.now();
  const createdAt = parseTimestamp(row.created_at, now);
  const updatedAt = parseTimestamp(row.updated_at, createdAt);

  return {
    id: row.id,
    title: row.title || "Focus Session",
    tag: row.tag || undefined,
    cyclesCompleted: Number(row.cycles_completed ?? 0),
    targetCycles: Number(row.target_cycles ?? 0),
    focusMinutes: Number(row.focus_minutes ?? 0),
    overtimeMinutes: Number(row.overtime_minutes ?? 0),
    overtimeSeconds: Number(row.overtime_seconds ?? 0),
    notes: row.notes || undefined,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    createdAt,
    updatedAt,
  };
}

function todoToRow(todo: TodoItem, userId?: string) {
  const now = Date.now();
  const createdAt = parseTimestamp(todo.createdAt, now);
  const updatedAt = parseTimestamp(todo.updatedAt, now);

  return {
    id: todo.id,
    user_id: userId,
    title: todo.title || "Untitled Task",
    completed: Boolean(todo.completed),
    tag: todo.tag || "general",
    priority: todo.priority || "medium",
    due_date: todo.dueDate || null,
    notes: todo.notes || null,
    archived: Boolean(todo.archived),
    is_deleted: Boolean(todo.isDeleted),
    version: todo.version || 1,
    created_at: createdAt,
    completed_at: todo.completedAt
      ? parseTimestamp(todo.completedAt, now)
      : null,
    updated_at: updatedAt,
  };
}

function rowToTodo(row: any): TodoItem {
  const now = Date.now();
  const createdAt = parseTimestamp(row.created_at, now);
  const updatedAt = parseTimestamp(row.updated_at, createdAt);

  return {
    id: row.id,
    title: row.title || "Untitled Task",
    completed: Boolean(row.completed),
    tag: row.tag || "general",
    priority: row.priority || "medium",
    dueDate: row.due_date ? String(row.due_date) : undefined,
    notes: row.notes || undefined,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at ? parseTimestamp(row.archived_at) : undefined,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    createdAt,
    completedAt: row.completed_at
      ? parseTimestamp(row.completed_at)
      : undefined,
    updatedAt,
  };
}

function backgroundToRow(bg: ThemeBackground, userId?: string) {
  const now = Date.now();
  const updatedAt = parseTimestamp(bg.updatedAt, now);

  return {
    id: bg.id,
    user_id: userId,
    name: bg.name || "Custom Wallpaper",
    url: bg.url || "",
    thumbnail: bg.thumbnail || null,
    is_deleted: Boolean(bg.isDeleted),
    version: bg.version || 1,
    created_at: now,
    updated_at: updatedAt,
  };
}

function rowToBackground(row: any): ThemeBackground {
  const now = Date.now();
  const updatedAt = parseTimestamp(row.updated_at, now);

  return {
    id: row.id,
    name: row.name || "Custom Wallpaper",
    url: row.url || "",
    thumbnail: row.thumbnail || undefined,
    isCustom: true,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    updatedAt,
  };
}

function playlistToRow(pl: Playlist, userId?: string) {
  const now = Date.now();
  const updatedAt = parseTimestamp(pl.updatedAt, now);

  return {
    id: pl.id,
    user_id: userId,
    title: pl.title || "Custom Playlist",
    author: pl.author || "Custom Creator",
    platform: pl.platform || "youtube",
    url: pl.url || "",
    cover_url: pl.coverUrl || null,
    category: pl.category || "custom",
    is_live: Boolean(pl.isLive),
    is_deleted: Boolean(pl.isDeleted),
    version: pl.version || 1,
    created_at: now,
    updated_at: updatedAt,
  };
}

function rowToPlaylist(row: any): Playlist {
  const now = Date.now();
  const updatedAt = parseTimestamp(row.updated_at, now);

  return {
    id: row.id,
    title: row.title || "Custom Playlist",
    author: row.author || "Custom Creator",
    platform: row.platform || "youtube",
    url: row.url || "",
    coverUrl: row.cover_url || undefined,
    category: row.category || "custom",
    isLive: Boolean(row.is_live),
    isCustom: true,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    updatedAt,
  };
}

type EntityGroup<T> = {
  latestRow: T | null;
  queueItemIds: string[];
};

export class SupabaseRemoteProvider implements RemoteDatabaseProvider {
  public name = "supabase";

  public async pushBatch(
    items: SyncQueueItem[],
  ): Promise<{ success: boolean; syncedIds: string[] }> {
    if (!supabase || items.length === 0)
      return { success: false, syncedIds: [] };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      // User is offline or not logged in; keep items queued
      return { success: false, syncedIds: [] };
    }

    const userId = session.user.id;
    const now = Date.now();

    // Deduplicate and group mutations by entityId to ensure unique primary keys in PostgreSQL bulk upserts
    const sessionMap = new Map<string, EntityGroup<any>>();
    const todoMap = new Map<string, EntityGroup<any>>();
    const bgMap = new Map<string, EntityGroup<any>>();
    const playlistMap = new Map<string, EntityGroup<any>>();

    for (const item of items) {
      if (item.store === "sessions") {
        let existing = sessionMap.get(item.entityId);

        if (!existing) {
          existing = { latestRow: null, queueItemIds: [] };
          sessionMap.set(item.entityId, existing);
        }
        existing.queueItemIds.push(item.id);

        if (item.action === "delete") {
          existing.latestRow = {
            id: item.entityId,
            user_id: userId,
            title: "Deleted Session",
            tag: null,
            cycles_completed: 0,
            target_cycles: 0,
            focus_minutes: 0,
            overtime_minutes: 0,
            overtime_seconds: 0,
            notes: null,
            is_deleted: true,
            version: 1,
            created_at: now,
            updated_at: now,
          };
        } else if (item.payload) {
          existing.latestRow = sessionToRow(
            item.payload as SessionRecord,
            userId,
          );
        }
      } else if (item.store === "todos") {
        let existing = todoMap.get(item.entityId);

        if (!existing) {
          existing = { latestRow: null, queueItemIds: [] };
          todoMap.set(item.entityId, existing);
        }
        existing.queueItemIds.push(item.id);

        if (item.action === "delete") {
          existing.latestRow = {
            id: item.entityId,
            user_id: userId,
            title: "Deleted Task",
            completed: false,
            tag: "general",
            priority: "medium",
            due_date: null,
            notes: null,
            archived: false,
            is_deleted: true,
            version: 1,
            created_at: now,
            completed_at: null,
            updated_at: now,
          };
        } else if (item.payload) {
          existing.latestRow = todoToRow(item.payload as TodoItem, userId);
        }
      } else if (item.store === "customBackgrounds") {
        let existing = bgMap.get(item.entityId);

        if (!existing) {
          existing = { latestRow: null, queueItemIds: [] };
          bgMap.set(item.entityId, existing);
        }
        existing.queueItemIds.push(item.id);

        if (item.action === "delete") {
          existing.latestRow = {
            id: item.entityId,
            user_id: userId,
            name: "Deleted Background",
            url: "",
            thumbnail: null,
            is_deleted: true,
            version: 1,
            created_at: now,
            updated_at: now,
          };
        } else if (item.payload) {
          existing.latestRow = backgroundToRow(
            item.payload as ThemeBackground,
            userId,
          );
        }
      } else if (item.store === "customPlaylists") {
        let existing = playlistMap.get(item.entityId);

        if (!existing) {
          existing = { latestRow: null, queueItemIds: [] };
          playlistMap.set(item.entityId, existing);
        }
        existing.queueItemIds.push(item.id);

        if (item.action === "delete") {
          existing.latestRow = {
            id: item.entityId,
            user_id: userId,
            title: "Deleted Playlist",
            author: "Custom Creator",
            platform: "youtube",
            url: "",
            cover_url: null,
            category: "custom",
            is_live: false,
            is_deleted: true,
            version: 1,
            created_at: now,
            updated_at: now,
          };
        } else if (item.payload) {
          existing.latestRow = playlistToRow(item.payload as Playlist, userId);
        }
      }
    }

    const syncedIds: string[] = [];
    let hadError = false;

    // 1. Bulk Upsert Sessions (Unique IDs)
    const sessionEntries = Array.from(sessionMap.values()).filter(
      (g) => g.latestRow !== null,
    );

    if (sessionEntries.length > 0) {
      const rows = sessionEntries.map((g) => g.latestRow);
      const { error } = await supabase.from("sessions").upsert(rows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on sessions:", error);
        hadError = true;
      } else {
        for (const entry of sessionEntries) {
          syncedIds.push(...entry.queueItemIds);
        }
      }
    }

    // 2. Bulk Upsert Todos (Unique IDs)
    const todoEntries = Array.from(todoMap.values()).filter(
      (g) => g.latestRow !== null,
    );

    if (todoEntries.length > 0) {
      const rows = todoEntries.map((g) => g.latestRow);
      const { error } = await supabase.from("todos").upsert(rows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on todos:", error);
        hadError = true;
      } else {
        for (const entry of todoEntries) {
          syncedIds.push(...entry.queueItemIds);
        }
      }
    }

    // 3. Bulk Upsert Backgrounds (Unique IDs)
    const bgEntries = Array.from(bgMap.values()).filter(
      (g) => g.latestRow !== null,
    );

    if (bgEntries.length > 0) {
      const rows = bgEntries.map((g) => g.latestRow);
      const { error } = await supabase.from("custom_backgrounds").upsert(rows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          "Supabase bulk upsert error on custom_backgrounds:",
          error,
        );
        hadError = true;
      } else {
        for (const entry of bgEntries) {
          syncedIds.push(...entry.queueItemIds);
        }
      }
    }

    // 4. Bulk Upsert Playlists (Unique IDs)
    const playlistEntries = Array.from(playlistMap.values()).filter(
      (g) => g.latestRow !== null,
    );

    if (playlistEntries.length > 0) {
      const rows = playlistEntries.map((g) => g.latestRow);
      const { error } = await supabase.from("custom_playlists").upsert(rows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on custom_playlists:", error);
        hadError = true;
      } else {
        for (const entry of playlistEntries) {
          syncedIds.push(...entry.queueItemIds);
        }
      }
    }

    return {
      success: !hadError,
      syncedIds,
    };
  }

  public async pullChanges(sinceTimestamp: number): Promise<{
    sessions?: SessionRecord[];
    todos?: TodoItem[];
    customBackgrounds?: ThemeBackground[];
    customPlaylists?: Playlist[];
    timestamp: number;
  }> {
    if (!supabase) return { timestamp: Date.now() };
    const client = supabase;

    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user) return { timestamp: Date.now() };

    try {
      const now = Date.now();

      const queryTable = async (tableName: string) => {
        let query = client.from(tableName).select("*");

        if (sinceTimestamp > 0) {
          query = query.gt("updated_at", sinceTimestamp);
        }

        return await query;
      };

      const [
        { data: sessionRows, error: sessionErr },
        { data: todoRows, error: todoErr },
        { data: bgRows, error: bgErr },
        { data: plRows, error: plErr },
      ] = await Promise.all([
        queryTable("sessions"),
        queryTable("todos"),
        queryTable("custom_backgrounds"),
        queryTable("custom_playlists"),
      ]);

      // eslint-disable-next-line no-console
      if (sessionErr) console.error("Pull sessions error:", sessionErr);
      // eslint-disable-next-line no-console
      if (todoErr) console.error("Pull todos error:", todoErr);
      // eslint-disable-next-line no-console
      if (bgErr) console.error("Pull backgrounds error:", bgErr);
      // eslint-disable-next-line no-console
      if (plErr) console.error("Pull playlists error:", plErr);

      return {
        sessions: sessionRows ? sessionRows.map(rowToSession) : undefined,
        todos: todoRows ? todoRows.map(rowToTodo) : undefined,
        customBackgrounds: bgRows ? bgRows.map(rowToBackground) : undefined,
        customPlaylists: plRows ? plRows.map(rowToPlaylist) : undefined,
        timestamp: now,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Supabase pullChanges exception:", err);

      return { timestamp: Date.now() };
    }
  }
}

export const supabaseProvider = new SupabaseRemoteProvider();
