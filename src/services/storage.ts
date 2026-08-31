export const storageAdapter = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);

      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota exceeded or disabled
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage disabled
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Storage disabled
    }
  },
};

export const STORAGE_KEYS = {
  TIMER_STATE: "timer",
  SESSIONS_HISTORY: "history",
  THEME_CONFIG: "theme",
  TODOS: "todos",
  SETTINGS: "settings",
} as const;

export interface AppSettings {
  todo?: {
    mode?: "minimal" | "detailed";
  };
  [key: string]: unknown;
}

export interface SessionRecord {
  id: string;
  createdAt: number;
  title: string;
  tag?: string;
  cyclesCompleted?: number;
  sprintsCompleted?: number; // legacy backwards compatibility
  targetCycles?: number;
  targetSprints?: number; // legacy backwards compatibility
  focusMinutes: number;
  overtimeMinutes?: number;
  overtimeSeconds?: number;
  notes?: string;
}
