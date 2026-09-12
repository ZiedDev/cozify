import { storageAdapter, STORAGE_KEYS, SessionRecord } from "./storage";
import { StatsRollupEngine } from "./stats-rollup-engine";
import { db } from "./db";

import { ThemeConfig } from "@/config/themes";

type CozifyBackupData = {
  timer?: any;
  history?: SessionRecord[];
  theme?: Partial<ThemeConfig>;
  todos?: any[];
  [key: string]: any;
};

type CozifyBackup = {
  version: number;
  exportedAt: string;
  stats?: {
    sessionsCount: number;
    totalFocusMinutes: number;
    customWallpapersCount: number;
  };
  data: CozifyBackupData;
};

export type StorageOverview = {
  sessionsCount: number;
  todosCount: number;
  totalFocusMinutes: number;
  customWallpapersCount: number;
  storageSizeBytes: number;
  formattedStorageSize: string;
};

/**
 * Calculates storage metrics and statistics from localStorage
 */
export function getStorageOverview(): StorageOverview {
  const sessions = storageAdapter.getItem<SessionRecord[]>(
    STORAGE_KEYS.SESSIONS_HISTORY,
    [],
  );
  const todos = storageAdapter.getItem<any[]>(STORAGE_KEYS.TODOS, []);
  const theme = storageAdapter.getItem<Partial<ThemeConfig> | null>(
    STORAGE_KEYS.THEME_CONFIG,
    null,
  );

  const totalFocusMinutes = Array.isArray(sessions)
    ? sessions.reduce(
        (totalMins, session) =>
          totalMins +
          (Number(session.focusMinutes) || 0) +
          (Number(session.overtimeMinutes) || 0),
        0,
      )
    : 0;

  const customWallpapersCount =
    theme && Array.isArray(theme.customBackgrounds)
      ? theme.customBackgrounds.length
      : 0;

  // Calculate total size of app keys in localStorage
  let totalBytes = 0;
  const appKeys = new Set(Object.values(STORAGE_KEYS));

  try {
    for (let storageIndex = 0; storageIndex < localStorage.length; storageIndex++) {
      const key = localStorage.key(storageIndex);

      if (key && appKeys.has(key as any)) {
        const value = localStorage.getItem(key) || "";

        totalBytes += (key.length + value.length) * 2; // UTF-16 characters
      }
    }
  } catch {
    // Storage access issue fallback
  }

  const formattedStorageSize =
    totalBytes < 1024
      ? `${totalBytes} B`
      : totalBytes < 1024 * 1024
        ? `${(totalBytes / 1024).toFixed(1)} KB`
        : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;

  return {
    sessionsCount: Array.isArray(sessions) ? sessions.length : 0,
    todosCount: Array.isArray(todos) ? todos.length : 0,
    totalFocusMinutes,
    customWallpapersCount,
    storageSizeBytes: totalBytes,
    formattedStorageSize,
  };
}

/**
 * Creates the clean minimal backup object containing only user data
 */
export function createBackup(): CozifyBackup {
  const sessions = storageAdapter.getItem<SessionRecord[] | null>(
    STORAGE_KEYS.SESSIONS_HISTORY,
    null,
  );
  const theme = storageAdapter.getItem<Partial<ThemeConfig> | null>(
    STORAGE_KEYS.THEME_CONFIG,
    null,
  );
  const timerState = storageAdapter.getItem<any>(
    STORAGE_KEYS.TIMER_STATE,
    null,
  );
  const todos = storageAdapter.getItem<any[] | null>(STORAGE_KEYS.TODOS, null);
  const settings = storageAdapter.getItem<any | null>(
    STORAGE_KEYS.SETTINGS,
    null,
  );

  const overview = getStorageOverview();

  const data: CozifyBackupData = {};

  if (Array.isArray(sessions) && sessions.length > 0) {
    data.history = sessions;
  }
  if (theme && Object.keys(theme).length > 0) {
    data.theme = theme;
  }
  if (timerState && Object.keys(timerState).length > 0) {
    data.timer = timerState;
  }
  if (Array.isArray(todos) && todos.length > 0) {
    data.todos = todos;
  }
  if (settings && Object.keys(settings).length > 0) {
    data.settings = settings;
  }

  const backup: CozifyBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stats: {
      sessionsCount: overview.sessionsCount,
      totalFocusMinutes: overview.totalFocusMinutes,
      customWallpapersCount: overview.customWallpapersCount,
    },
    data,
  };

  return backup;
}

/**
 * Triggers a download of the clean minimal JSON backup file in the browser
 */
export function exportAndDownloadBackup(): {
  fileName: string;
  sessionsCount: number;
} {
  const backup = createBackup();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const fileName = `cozify-backup-${dateStr}.json`;

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    fileName,
    sessionsCount: backup.stats?.sessionsCount || 0,
  };
}

type ImportResult = {
  success: boolean;
  message: string;
  details?: {
    sessionsCount: number;
    hasTheme: boolean;
    hasTimer: boolean;
  };
};

/**
 * Validates and imports data from a JSON string or parsed object
 */
export function importBackupFromJson(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        message: "Invalid file format: JSON root must be an object.",
      };
    }

    let payload: CozifyBackupData = {};

    if (parsed.data && typeof parsed.data === "object") {
      payload = parsed.data;
    } else {
      payload = parsed;
    }

    let importedSessionsCount = 0;
    let hasTheme = false;
    let hasTimer = false;
    let importedTodosCount = 0;

    // 1. Sessions History
    const sessions = payload.history || payload[STORAGE_KEYS.SESSIONS_HISTORY];

    if (Array.isArray(sessions)) {
      storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, sessions);
      importedSessionsCount = sessions.length;
    }

    // 2. Theme Config
    const rawTheme = payload.theme || payload[STORAGE_KEYS.THEME_CONFIG];

    if (rawTheme && typeof rawTheme === "object") {
      const cleanedTheme: Record<string, unknown> = { ...rawTheme };

      delete cleanedTheme.chroma;
      delete cleanedTheme.lightness;

      if (Object.keys(cleanedTheme).length > 0) {
        storageAdapter.setItem(
          STORAGE_KEYS.THEME_CONFIG,
          cleanedTheme as Partial<ThemeConfig>,
        );
        hasTheme = true;
      }
    }

    // 3. Timer State
    const timer = payload.timer || payload[STORAGE_KEYS.TIMER_STATE];

    if (timer && typeof timer === "object") {
      storageAdapter.setItem(STORAGE_KEYS.TIMER_STATE, timer);
      hasTimer = true;
    }

    // 4. Todos
    const todos = payload.todos || payload[STORAGE_KEYS.TODOS];

    if (Array.isArray(todos)) {
      storageAdapter.setItem(STORAGE_KEYS.TODOS, todos);
      importedTodosCount = todos.length;
    }

    // 5. Settings
    const settings = payload.settings || payload[STORAGE_KEYS.SETTINGS];

    if (settings && typeof settings === "object") {
      storageAdapter.setItem(STORAGE_KEYS.SETTINGS, settings);
    }

    // Check if anything was actually imported
    if (
      importedSessionsCount === 0 &&
      !hasTheme &&
      !hasTimer &&
      importedTodosCount === 0 &&
      !settings
    ) {
      return {
        success: false,
        message: "No recognizable Cozify data found in this file.",
      };
    }

    // Rebuild Stats Rollups
    const finalSessions = storageAdapter.getItem<SessionRecord[]>(
      STORAGE_KEYS.SESSIONS_HISTORY,
      [],
    );
    const finalTodos = storageAdapter.getItem<any[]>(STORAGE_KEYS.TODOS, []);
    StatsRollupEngine.rebuildAll(
      Array.isArray(finalSessions) ? finalSessions : [],
      Array.isArray(finalTodos) ? finalTodos : [],
    );

    return {
      success: true,
      message: "Data imported successfully!",
      details: {
        sessionsCount: importedSessionsCount,
        hasTheme,
        hasTimer,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Failed to parse JSON file.",
    };
  }
}

/**
 * Resets all Cozify data by clearing localStorage and databases entirely
 */
export function resetAllCozifyData(): void {
  try {
    storageAdapter.clear();
    db.dailyRollups.clear();
    db.statsSummary.clear();
  } catch {
    // Storage access issue fallback
  }
}
