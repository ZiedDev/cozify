import { storageAdapter, STORAGE_KEYS, SessionRecord } from "./storage";

import { ThemeConfig } from "@/config/themes";

export interface CozifyBackupData {
  timer?: any;
  history?: SessionRecord[];
  theme?: Partial<ThemeConfig>;
  [key: string]: any;
}

export interface CozifyBackup {
  version: number;
  exportedAt: string;
  stats?: {
    sessionsCount: number;
    totalFocusMinutes: number;
    customWallpapersCount: number;
  };
  data: CozifyBackupData;
}

export interface StorageOverview {
  sessionsCount: number;
  totalFocusMinutes: number;
  customWallpapersCount: number;
  storageSizeBytes: number;
  formattedStorageSize: string;
}

/**
 * Calculates storage metrics and statistics from localStorage
 */
export function getStorageOverview(): StorageOverview {
  const sessions = storageAdapter.getItem<SessionRecord[]>(
    STORAGE_KEYS.SESSIONS_HISTORY,
    [],
  );
  const theme = storageAdapter.getItem<Partial<ThemeConfig> | null>(
    STORAGE_KEYS.THEME_CONFIG,
    null,
  );

  let totalFocusMinutes = 0;

  if (Array.isArray(sessions)) {
    totalFocusMinutes = sessions.reduce(
      (acc, s) =>
        acc + (Number(s.focusMinutes) || 0) + (Number(s.overtimeMinutes) || 0),
      0,
    );
  }

  const customWallpapersCount =
    theme && Array.isArray(theme.customBackgrounds)
      ? theme.customBackgrounds.length
      : 0;

  // Calculate total size of app keys in localStorage
  let totalBytes = 0;
  const appKeys = new Set(["history", "theme", "timer"]);

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && (appKeys.has(key) || key.startsWith("cozify"))) {
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

export interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    sessionsCount: number;
    hasTheme: boolean;
    hasTimer: boolean;
  };
}

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

    // Check if nested data format or flat key-value dump format
    if (parsed.data && typeof parsed.data === "object") {
      payload = parsed.data;
    } else {
      payload = parsed;
    }

    let importedSessionsCount = 0;
    let hasTheme = false;
    let hasTimer = false;

    // 1. Sessions History (supports clean key 'history' as well as legacy keys)
    const sessions =
      payload.history ||
      payload[STORAGE_KEYS.SESSIONS_HISTORY] ||
      payload.sessionsHistory ||
      payload.sessions ||
      payload["cozify:sessions:history"];

    if (Array.isArray(sessions)) {
      storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, sessions);
      importedSessionsCount = sessions.length;
    }

    // 2. Theme Config (supports clean key 'theme' as well as legacy keys)
    const rawTheme =
      payload.theme ||
      payload[STORAGE_KEYS.THEME_CONFIG] ||
      payload.themeConfig ||
      payload["cozify:theme:config"];

    if (rawTheme && typeof rawTheme === "object") {
      const cleanedTheme = { ...rawTheme };

      delete cleanedTheme.chroma;
      delete cleanedTheme.lightness;

      if (Object.keys(cleanedTheme).length > 0) {
        storageAdapter.setItem(STORAGE_KEYS.THEME_CONFIG, cleanedTheme);
        hasTheme = true;
      }
    }

    // 3. Timer State (supports clean key 'timer' as well as legacy keys)
    const timer =
      payload.timer ||
      payload[STORAGE_KEYS.TIMER_STATE] ||
      payload.timerState ||
      payload["cozify:timer:state"];

    if (timer && typeof timer === "object") {
      storageAdapter.setItem(STORAGE_KEYS.TIMER_STATE, timer);
      hasTimer = true;
    }

    // Check if anything was actually imported
    if (importedSessionsCount === 0 && !hasTheme && !hasTimer) {
      return {
        success: false,
        message: "No recognizable Cozify data found in this file.",
      };
    }

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
 * Resets all Cozify data in localStorage
 */
export function resetAllCozifyData(): void {
  try {
    const appKeys = new Set(["history", "theme", "timer", "heroui-theme"]);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && (appKeys.has(key) || key.startsWith("cozify"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Fallback manual key clear
    localStorage.removeItem(STORAGE_KEYS.SESSIONS_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.THEME_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    localStorage.removeItem("history");
    localStorage.removeItem("theme");
    localStorage.removeItem("timer");
    localStorage.removeItem("cozify:sessions:history");
    localStorage.removeItem("cozify:theme:config");
    localStorage.removeItem("cozify:timer:state");
  }
}
