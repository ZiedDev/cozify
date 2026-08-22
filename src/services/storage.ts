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
      // Storage unavailable or quota exceeded
    }
  },
};

export const STORAGE_KEYS = {
  TIMER_STATE: "cozify:timer:state",
  SESSIONS_HISTORY: "cozify:sessions:history",
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
