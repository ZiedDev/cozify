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
function sessionToRow(session: SessionRecord) {
  const now = Date.now();

  return {
    id: session.id,
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

function todoToRow(todo: TodoItem) {
  const now = Date.now();

  return {
    id: todo.id,
    title: todo.title,
    completed: Boolean(todo.completed),
    tag: todo.tag || "general",
    priority: todo.priority || "medium",
    due_date: todo.dueDate || null,
    notes: todo.notes || null,
    archived: Boolean(todo.archived),
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

function backgroundToRow(bg: ThemeBackground) {
  const now = Date.now();

  return {
    id: bg.id,
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

function playlistToRow(pl: Playlist) {
  const now = Date.now();

  return {
    id: pl.id,
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
            title: "Deleted Session",
            focus_minutes: 0,
            created_at: now,
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          sessionRows.push(sessionToRow(item.payload as SessionRecord));
        }
      } else if (item.store === "todos") {
        todoItemIds.push(item.id);
        if (item.action === "delete") {
          todoRows.push({
            id: item.entityId,
            title: "Deleted Task",
            created_at: now,
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          todoRows.push(todoToRow(item.payload as TodoItem));
        }
      } else if (item.store === "customBackgrounds") {
        bgItemIds.push(item.id);
        if (item.action === "delete") {
          bgRows.push({
            id: item.entityId,
            name: "Deleted Background",
            url: "",
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          bgRows.push(backgroundToRow(item.payload as ThemeBackground));
        }
      } else if (item.store === "customPlaylists") {
        playlistItemIds.push(item.id);
        if (item.action === "delete") {
          playlistRows.push({
            id: item.entityId,
            title: "Deleted Playlist",
            platform: "youtube",
            url: "",
            is_deleted: true,
            updated_at: now,
          });
        } else if (item.payload) {
          playlistRows.push(playlistToRow(item.payload as Playlist));
        }
      }
    }

    let hadError = false;

    // 1. Bulk Upsert Sessions
    if (sessionRows.length > 0) {
      const { error } = await supabase.from("sessions").upsert(sessionRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on sessions:", error);
        hadError = true;
      } else {
        syncedIds.push(...sessionItemIds);
      }
    }

    // 2. Bulk Upsert Todos
    if (todoRows.length > 0) {
      const { error } = await supabase.from("todos").upsert(todoRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on todos:", error);
        hadError = true;
      } else {
        syncedIds.push(...todoItemIds);
      }
    }

    // 3. Bulk Upsert Backgrounds
    if (bgRows.length > 0) {
      const { error } = await supabase
        .from("custom_backgrounds")
        .upsert(bgRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          "Supabase bulk upsert error on custom_backgrounds:",
          error,
        );
        hadError = true;
      } else {
        syncedIds.push(...bgItemIds);
      }
    }

    // 4. Bulk Upsert Playlists
    if (playlistRows.length > 0) {
      const { error } = await supabase
        .from("custom_playlists")
        .upsert(playlistRows);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase bulk upsert error on custom_playlists:", error);
        hadError = true;
      } else {
        syncedIds.push(...playlistItemIds);
      }
    }

    return {
      success: !hadError && syncedIds.length === items.length,
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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return { timestamp: Date.now() };

    try {
      const now = Date.now();

      // Pull sessions (including tombstones)
      let sessionsQuery = supabase.from("sessions").select("*");

      if (sinceTimestamp > 0) {
        sessionsQuery = sessionsQuery.gt("updated_at", sinceTimestamp);
      }
      const { data: sessionRows, error: sessionErr } = await sessionsQuery;

      // eslint-disable-next-line no-console
      if (sessionErr) console.error("Pull sessions error:", sessionErr);

      // Pull todos (including tombstones)
      let todosQuery = supabase.from("todos").select("*");

      if (sinceTimestamp > 0) {
        todosQuery = todosQuery.gt("updated_at", sinceTimestamp);
      }
      const { data: todoRows, error: todoErr } = await todosQuery;

      // eslint-disable-next-line no-console
      if (todoErr) console.error("Pull todos error:", todoErr);

      // Pull customBackgrounds
      let bgQuery = supabase.from("custom_backgrounds").select("*");

      if (sinceTimestamp > 0) {
        bgQuery = bgQuery.gt("updated_at", sinceTimestamp);
      }
      const { data: bgRows, error: bgErr } = await bgQuery;

      // eslint-disable-next-line no-console
      if (bgErr) console.error("Pull backgrounds error:", bgErr);

      // Pull customPlaylists
      let plQuery = supabase.from("custom_playlists").select("*");

      if (sinceTimestamp > 0) {
        plQuery = plQuery.gt("updated_at", sinceTimestamp);
      }
      const { data: plRows, error: plErr } = await plQuery;

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
