export const storageAdapter = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const raw =
        localStorage.getItem(key) ??
        localStorage.getItem(`cozify:${key}`) ??
        (key === "history"
          ? localStorage.getItem("cozify:sessions:history")
          : null) ??
        (key === "theme"
          ? localStorage.getItem("cozify:theme:config")
          : null) ??
        (key === "timer" ? localStorage.getItem("cozify:timer:state") : null);

      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Clean up legacy prefixed key if present
      localStorage.removeItem(`cozify:${key}`);
    } catch {
      // Storage unavailable or quota exceeded
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`cozify:${key}`);
      if (key === "history") localStorage.removeItem("cozify:sessions:history");
      if (key === "theme") localStorage.removeItem("cozify:theme:config");
      if (key === "timer") localStorage.removeItem("cozify:timer:state");
    } catch {
      // Storage unavailable
    }
  },
};

export const STORAGE_KEYS = {
  TIMER_STATE: "timer",
  SESSIONS_HISTORY: "history",
  THEME_CONFIG: "theme",
} as const;

export interface SessionRecord {
  id: string;
  createdAt: number;
  title: string;
  sprintsCompleted: number;
  targetSprints: number;
  focusMinutes: number;
  overtimeMinutes: number;
  notes?: string;
}
