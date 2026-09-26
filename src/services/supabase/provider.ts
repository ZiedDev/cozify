import {
  RemoteDatabaseProvider,
  SyncQueueItem,
  SessionRecord,
} from "../db/types";

import { supabase } from "./client";

import { TodoItem } from "@/menus/todo/types";
import { ThemeBackground } from "@/config/themes";
import { Playlist } from "@/config/playlists";

// Transform helpers between camelCase app types and snake_case Postgres columns
function sessionToRow(session: SessionRecord, userId?: string) {
  const now = Date.now();

  return {
    id: session.id,
    ...(userId ? { user_id: userId } : {}),
    title: session.title,
    tag: session.tag || null,
    cycles_completed: session.cyclesCompleted ?? session.sprintsCompleted ?? 0,
    target_cycles: session.targetCycles ?? session.targetSprints ?? 0,
    focus_minutes: session.focusMinutes,
    overtime_minutes: session.overtimeMinutes ?? 0,
    overtime_seconds: session.overtimeSeconds ?? 0,
    notes: session.notes || null,
    is_deleted: Boolean(session.isDeleted),
    version: session.version || 1,
    created_at: Number(session.createdAt || now),
    updated_at: Number(session.updatedAt || session.createdAt || now),
  };
}

function rowToSession(row: any): SessionRecord {
  return {
    id: row.id,
    title: row.title,
    tag: row.tag || undefined,
    cyclesCompleted: row.cycles_completed,
    targetCycles: row.target_cycles,
    focusMinutes: row.focus_minutes,
    overtimeMinutes: row.overtime_minutes,
    overtimeSeconds: row.overtime_seconds,
    notes: row.notes || undefined,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function todoToRow(todo: TodoItem, userId?: string) {
  const now = Date.now();

  return {
    id: todo.id,
    ...(userId ? { user_id: userId } : {}),
    title: todo.title,
    completed: Boolean(todo.completed),
    tag: todo.tag || "general",
    priority: todo.priority || "medium",
    due_date: todo.dueDate || null,
    notes: todo.notes || null,
    archived: Boolean(todo.archived),
    archived_at: todo.archivedAt ? Number(todo.archivedAt) : null,
    is_deleted: Boolean(todo.isDeleted),
    version: todo.version || 1,
    created_at: Number(todo.createdAt || now),
    completed_at: todo.completedAt ? Number(todo.completedAt) : null,
    updated_at: Number(todo.updatedAt || now),
  };
}

function rowToTodo(row: any): TodoItem {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    tag: row.tag || "general",
    priority: row.priority || "medium",
    dueDate: row.due_date ? String(row.due_date) : undefined,
    notes: row.notes || undefined,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at ? Number(row.archived_at) : undefined,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    createdAt: Number(row.created_at),
    completedAt: row.completed_at ? Number(row.completed_at) : undefined,
    updatedAt: Number(row.updated_at),
  };
}

function backgroundToRow(bg: ThemeBackground, userId?: string) {
  const now = Date.now();

  return {
    id: bg.id,
    ...(userId ? { user_id: userId } : {}),
    name: bg.name,
    url: bg.url,
    thumbnail: bg.thumbnail || null,
    is_deleted: Boolean(bg.isDeleted),
    version: bg.version || 1,
    created_at: now,
    updated_at: Number(bg.updatedAt || now),
  };
}

function rowToBackground(row: any): ThemeBackground {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    thumbnail: row.thumbnail || undefined,
    isCustom: true,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    updatedAt: Number(row.updated_at),
  };
}

function playlistToRow(pl: Playlist, userId?: string) {
  const now = Date.now();

  return {
    id: pl.id,
    ...(userId ? { user_id: userId } : {}),
    title: pl.title,
    author: pl.author || "Custom Creator",
    platform: pl.platform,
    url: pl.url,
    cover_url: pl.coverUrl || null,
    category: pl.category || "custom",
    is_live: Boolean(pl.isLive),
    is_deleted: Boolean(pl.isDeleted),
    version: pl.version || 1,
    created_at: now,
    updated_at: Number(pl.updatedAt || now),
  };
}

function rowToPlaylist(row: any): Playlist {
  return {
    id: row.id,
    title: row.title,
    author: row.author || "Custom Creator",
    platform: row.platform,
    url: row.url,
    coverUrl: row.cover_url || undefined,
    category: row.category || "custom",
    isLive: Boolean(row.is_live),
    isCustom: true,
    isDeleted: Boolean(row.is_deleted),
    version: Number(row.version || 1),
    updatedAt: Number(row.updated_at),
  };
}

async function safeUpsert(
  table: string,
  rows: any[],
): Promise<{ error: any }> {
  if (rows.length === 0) return { error: null };
  const { error } = await supabase!.from(table).upsert(rows);

  if (!error) return { error: null };

  // If error is about a missing column (e.g. user_id or archived_at), try stripping them and retrying
  const errMsg = (error.message || "").toLowerCase();

  if (
    errMsg.includes("column") ||
    errMsg.includes("schema cache") ||
    error.code === "PGRST204" ||
    error.code === "42703"
  ) {
    const cleanedRows = rows.map((row) => {
      const copy = { ...row };

      delete copy.user_id;
      delete copy.archived_at;

      return copy;
    });
    const retryRes = await supabase!.from(table).upsert(cleanedRows);

    if (!retryRes.error) {
      return { error: null };
    }

    return { error: retryRes.error };
  }

  return { error };
}

async function safePull(
  table: string,
  userId: string,
  sinceTimestamp: number,
): Promise<{ data: any[] | null; error: any }> {
  // First try with user_id filter if userId is present
  let query = supabase!.from(table).select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (sinceTimestamp > 0) {
    query = query.gt("updated_at", sinceTimestamp);
  }

  const { data, error } = await query;

  if (error) {
    const errMsg = (error.message || "").toLowerCase();

    // If user_id column doesn't exist, retry without user_id filter (RLS or global)
    if (
      errMsg.includes("column") ||
      errMsg.includes("schema cache") ||
      error.code === "PGRST204" ||
      error.code === "42703"
    ) {
      let fallbackQuery = supabase!.from(table).select("*");

      if (sinceTimestamp > 0) {
        fallbackQuery = fallbackQuery.gt("updated_at", sinceTimestamp);
      }
      const fallbackRes = await fallbackQuery;

      if (!fallbackRes.error) {
        return { data: fallbackRes.data, error: null };
      }

      return { data: null, error: fallbackRes.error };
    }
  }

  return { data, error };
}

export class SupabaseRemoteProvider implements RemoteDatabaseProvider {
  public name = "supabase";

  public async pushBatch(
    items: SyncQueueItem[],
  ): Promise<{ success: boolean; syncedIds: string[]; error?: string }> {
    if (!supabase || items.length === 0)
      return { success: false, syncedIds: [] };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      // User is offline or not logged in; keep items queued
      return { success: false, syncedIds: [], error: "No authenticated session" };
    }

    const userId = session.user.id;
    const syncedIds: string[] = [];
    const now = Date.now();

    // Group items by store for bulk upserts
    const sessionRows: any[] = [];
    const sessionItemIds: string[] = [];

    const todoRows: any[] = [];
    const todoItemIds: string[] = [];

    const bgRows: any[] = [];
    const bgItemIds: string[] = [];

    const playlistRows: any[] = [];
    const playlistItemIds: string[] = [];

    for (const item of items) {
      if (item.store === "sessions") {
        sessionItemIds.push(item.id);
        if (item.action === "delete") {
          sessionRows.push({
            id: item.entityId,
            user_id: userId,
            title: "Deleted Session",
            focus_minutes: 0,
            created_at: now,
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          sessionRows.push(
            sessionToRow(item.payload as SessionRecord, userId),
          );
        }
      } else if (item.store === "todos") {
        todoItemIds.push(item.id);
        if (item.action === "delete") {
          todoRows.push({
            id: item.entityId,
            user_id: userId,
            title: "Deleted Task",
            created_at: now,
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          todoRows.push(todoToRow(item.payload as TodoItem, userId));
        }
      } else if (item.store === "customBackgrounds") {
        bgItemIds.push(item.id);
        if (item.action === "delete") {
          bgRows.push({
            id: item.entityId,
            user_id: userId,
            name: "Deleted Background",
            url: "",
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          bgRows.push(
            backgroundToRow(item.payload as ThemeBackground, userId),
          );
        }
      } else if (item.store === "customPlaylists") {
        playlistItemIds.push(item.id);
        if (item.action === "delete") {
          playlistRows.push({
            id: item.entityId,
            user_id: userId,
            title: "Deleted Playlist",
            platform: "youtube",
            url: "",
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          playlistRows.push(playlistToRow(item.payload as Playlist, userId));
        }
      } else {
        // Unknown or legacy store: mark as synced to prevent blocking the outbox
        syncedIds.push(item.id);
      }
    }

    let hadError = false;
    let lastErrMsg = "";

    // 1. Bulk Upsert Sessions
    if (sessionRows.length > 0) {
      const { error } = await safeUpsert("sessions", sessionRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on sessions:", error);
        hadError = true;
        lastErrMsg = error.message || "Failed to sync sessions";
      } else {
        syncedIds.push(...sessionItemIds);
      }
    }

    // 2. Bulk Upsert Todos
    if (todoRows.length > 0) {
      const { error } = await safeUpsert("todos", todoRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on todos:", error);
        hadError = true;
        lastErrMsg = error.message || "Failed to sync tasks";
      } else {
        syncedIds.push(...todoItemIds);
      }
    }

    // 3. Bulk Upsert Backgrounds
    if (bgRows.length > 0) {
      const { error } = await safeUpsert("custom_backgrounds", bgRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          "Supabase bulk upsert error on custom_backgrounds:",
          error,
        );
        hadError = true;
        lastErrMsg = error.message || "Failed to sync custom wallpapers";
      } else {
        syncedIds.push(...bgItemIds);
      }
    }

    // 4. Bulk Upsert Playlists
    if (playlistRows.length > 0) {
      const { error } = await safeUpsert("custom_playlists", playlistRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on custom_playlists:", error);
        hadError = true;
        lastErrMsg = error.message || "Failed to sync custom playlists";
      } else {
        syncedIds.push(...playlistItemIds);
      }
    }

    return {
      success: !hadError && syncedIds.length === items.length,
      syncedIds,
      error: hadError ? lastErrMsg : undefined,
    };
  }

  public async pullChanges(sinceTimestamp: number): Promise<{
    sessions?: SessionRecord[];
    todos?: TodoItem[];
    customBackgrounds?: ThemeBackground[];
    customPlaylists?: Playlist[];
    timestamp: number;
    error?: string;
  }> {
    if (!supabase) return { timestamp: Date.now() };

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return { timestamp: Date.now() };

    const userId = session.user.id;

    try {
      const now = Date.now();

      const [
        { data: sessionRows, error: sessionErr },
        { data: todoRows, error: todoErr },
        { data: bgRows, error: bgErr },
        { data: plRows, error: plErr },
      ] = await Promise.all([
        safePull("sessions", userId, sinceTimestamp),
        safePull("todos", userId, sinceTimestamp),
        safePull("custom_backgrounds", userId, sinceTimestamp),
        safePull("custom_playlists", userId, sinceTimestamp),
      ]);

      // eslint-disable-next-line no-console
      if (sessionErr) console.error("Pull sessions error:", sessionErr);
      // eslint-disable-next-line no-console
      if (todoErr) console.error("Pull todos error:", todoErr);
      // eslint-disable-next-line no-console
      if (bgErr) console.error("Pull backgrounds error:", bgErr);
      // eslint-disable-next-line no-console
      if (plErr) console.error("Pull playlists error:", plErr);

      const pullError = sessionErr || todoErr || bgErr || plErr;

      return {
        sessions: sessionRows ? sessionRows.map(rowToSession) : undefined,
        todos: todoRows ? todoRows.map(rowToTodo) : undefined,
        customBackgrounds: bgRows ? bgRows.map(rowToBackground) : undefined,
        customPlaylists: plRows ? plRows.map(rowToPlaylist) : undefined,
        timestamp: now,
        error: pullError?.message,
      };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Supabase pullChanges exception:", err);

      return { timestamp: Date.now(), error: err?.message };
    }
  }
}

export const supabaseProvider = new SupabaseRemoteProvider();
