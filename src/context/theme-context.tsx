import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useContext,
} from "react";
import { toast } from "@heroui/react";

import {
  ThemeBackground,
  DEFAULT_HUE,
  PRESET_BACKGROUNDS,
  WallpaperTuning,
  DEFAULT_WALLPAPER_TUNING,
  normalizeImageUrl,
} from "@/config/themes";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

const LOCAL_STORAGE_ACTIVE_BG_KEY = "cozify_active_wallpaper_id";
const LOCAL_STORAGE_WALLPAPER_TUNINGS_KEY = "cozify_wallpaper_tunings";

type ThemeContextValue = {
  activeBackground: ThemeBackground | null;
  allBackgrounds: ThemeBackground[];
  customBackgrounds: ThemeBackground[];
  overlayOpacity: number;
  blur: number;
  positionX: number;
  positionY: number;
  zoom: number;
  hue: number;
  selectBackground: (bg: ThemeBackground | null) => void;
  addCustomBackground: (name: string, url: string) => boolean;
  renameCustomBackground: (id: string, newName: string) => void;
  updateCustomBackground: (
    id: string,
    updates: { name?: string; url?: string },
  ) => void;
  removeCustomBackground: (id: string) => void;
  moveCustomBackground: (id: string, direction: "left" | "right") => void;
  reorderCustomBackgrounds: (activeId: string, overId: string) => void;
  setOverlayOpacity: (opacity: number) => void;
  setBlur: (blur: number) => void;
  setPositionX: (posX: number) => void;
  setPositionY: (posY: number) => void;
  setZoom: (zoom: number) => void;
  setAppThemeColor: (hue: number) => void;
  resetTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. Custom Wallpapers list (Persistent in IDB / syncable)
  const [customBackgrounds, setCustomBackgrounds] = useState<
    ThemeBackground[]
  >(() => {
    const saved = storageAdapter.getItem<{ customBackgrounds?: ThemeBackground[] } | null>(
      STORAGE_KEYS.THEME_CONFIG,
      null,
    );

    if (saved && Array.isArray(saved.customBackgrounds)) {
      return saved.customBackgrounds.map((bg) => ({
        ...bg,
        url: normalizeImageUrl(bg.url),
        isCustom: true,
      }));
    }

    return [];
  });

  // 2. Active Background ID (Device-local in localStorage)
  const [activeBackgroundId, setActiveBackgroundId] = useState<string | null>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_BG_KEY);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          return saved;
        }
      }
    }
    return null;
  });

  // 3. Per-Wallpaper Fine-Tuning & Hue Map (Device-local in localStorage)
  const [wallpaperTunings, setWallpaperTunings] = useState<
    Record<string, Partial<WallpaperTuning>>
  >(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_WALLPAPER_TUNINGS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) || {};
        } catch {}
      }
    }
    return {};
  });

  // Sync customBackgrounds to IndexedDB (syncable store)
  useEffect(() => {
    if (customBackgrounds.length > 0) {
      storageAdapter.setItem(STORAGE_KEYS.THEME_CONFIG, {
        customBackgrounds: customBackgrounds.map((bg) => ({
          id: bg.id,
          name: bg.name,
          url: bg.url,
          isCustom: true,
        })),
      });
    } else {
      storageAdapter.removeItem(STORAGE_KEYS.THEME_CONFIG);
    }
  }, [customBackgrounds]);

  // Sync activeBackgroundId to device localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        LOCAL_STORAGE_ACTIVE_BG_KEY,
        JSON.stringify(activeBackgroundId),
      );
    }
  }, [activeBackgroundId]);

  // Sync wallpaperTunings map to device localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        LOCAL_STORAGE_WALLPAPER_TUNINGS_KEY,
        JSON.stringify(wallpaperTunings),
      );
    }
  }, [wallpaperTunings]);

  // Active Key for current tuning lookup
  const activeKey = activeBackgroundId || "clean_slate";

  // Current active tuning profile (with safe fallback defaults)
  const currentTuning: WallpaperTuning = useMemo(() => {
    const saved = wallpaperTunings[activeKey] || {};

    return {
      overlayOpacity:
        saved.overlayOpacity ?? DEFAULT_WALLPAPER_TUNING.overlayOpacity,
      blur: saved.blur ?? DEFAULT_WALLPAPER_TUNING.blur,
      positionX: saved.positionX ?? DEFAULT_WALLPAPER_TUNING.positionX,
      positionY: saved.positionY ?? DEFAULT_WALLPAPER_TUNING.positionY,
      zoom: saved.zoom ?? DEFAULT_WALLPAPER_TUNING.zoom,
      hue: saved.hue ?? DEFAULT_WALLPAPER_TUNING.hue,
    };
  }, [wallpaperTunings, activeKey]);

  // Apply OKLCH palette changes across the entire app
  useEffect(() => {
    const root = document.documentElement;
    const activeHue = currentTuning.hue ?? DEFAULT_HUE;

    if (activeHue === DEFAULT_HUE) {
      root.style.removeProperty("--theme-hue");
    } else {
      root.style.setProperty("--theme-hue", String(activeHue));
    }
  }, [currentTuning.hue]);

  const allBackgrounds = useMemo(() => {
    return [...PRESET_BACKGROUNDS, ...customBackgrounds];
  }, [customBackgrounds]);

  const activeBackground = useMemo(() => {
    if (!activeBackgroundId) return null;

    return allBackgrounds.find((bg) => bg.id === activeBackgroundId) || null;
  }, [activeBackgroundId, allBackgrounds]);

  const selectBackground = useCallback((bg: ThemeBackground | null) => {
    setActiveBackgroundId(bg ? bg.id : null);
  }, []);

  const updateActiveTuning = useCallback(
    (updates: Partial<WallpaperTuning>) => {
      setWallpaperTunings((prev) => {
        const existing = prev[activeKey] || {};

        return {
          ...prev,
          [activeKey]: {
            ...existing,
            ...updates,
          },
        };
      });
    },
    [activeKey],
  );

  const addCustomBackground = useCallback(
    (name: string, url: string): boolean => {
      const trimmedUrl = url.trim();
      const trimmedName = name.trim() || "Custom Wallpaper";

      if (
        !trimmedUrl.startsWith("http://") &&
        !trimmedUrl.startsWith("https://")
      ) {
        toast("Invalid Image URL", {
          description:
            "Please enter a valid web image URL starting with http:// or https://",
          variant: "danger",
        });

        return false;
      }

      const normalizedUrl = normalizeImageUrl(trimmedUrl);

      const newBg: ThemeBackground = {
        id: crypto.randomUUID(),
        name: trimmedName,
        url: normalizedUrl,
        isCustom: true,
      };

      setCustomBackgrounds((prev) => [newBg, ...prev]);
      setActiveBackgroundId(newBg.id);

      toast("Wallpaper Added! 🎨", {
        description: `"${trimmedName}" is now active.`,
        variant: "accent",
        timeout: 2500,
      });

      return true;
    },
    [],
  );

  const renameCustomBackground = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();

    if (!trimmed) return;

    setCustomBackgrounds((prev) =>
      prev.map((bg) => (bg.id === id ? { ...bg, name: trimmed } : bg)),
    );

    toast("Wallpaper Renamed", {
      description: `Updated name to "${trimmed}".`,
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const updateCustomBackground = useCallback(
    (id: string, updates: { name?: string; url?: string }) => {
      const trimmedName = updates.name?.trim();
      const trimmedUrl = updates.url?.trim();

      if (trimmedUrl !== undefined && trimmedUrl !== "") {
        if (
          !trimmedUrl.startsWith("http://") &&
          !trimmedUrl.startsWith("https://")
        ) {
          toast("Invalid Image URL", {
            description:
              "Please enter a valid web image URL starting with http:// or https://",
            variant: "danger",
          });
          return;
        }
      }

      const normalizedUrl =
        trimmedUrl !== undefined && trimmedUrl !== ""
          ? normalizeImageUrl(trimmedUrl)
          : undefined;

      setCustomBackgrounds((prev) =>
        prev.map((bg) => {
          if (bg.id !== id) return bg;
          return {
            ...bg,
            name:
              trimmedName !== undefined && trimmedName !== ""
                ? trimmedName
                : bg.name,
            url:
              normalizedUrl !== undefined && normalizedUrl !== ""
                ? normalizedUrl
                : bg.url,
          };
        }),
      );

      toast("Wallpaper Updated", {
        description: "Custom wallpaper details have been saved.",
        variant: "default",
        timeout: 2000,
      });
    },
    [],
  );

  const removeCustomBackground = useCallback(
    (id: string) => {
      setCustomBackgrounds((prev) => prev.filter((bg) => bg.id !== id));
      setActiveBackgroundId((prev) => (prev === id ? null : prev));

      setWallpaperTunings((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });

      toast("Wallpaper Removed", {
        variant: "default",
        timeout: 2000,
      });
    },
    [],
  );

  const moveCustomBackground = useCallback(
    (id: string, direction: "left" | "right") => {
      setCustomBackgrounds((prev) => {
        const index = prev.findIndex((bg) => bg.id === id);

        if (index === -1) return prev;
        const targetIndex = direction === "left" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const [moved] = next.splice(index, 1);

        next.splice(targetIndex, 0, moved);

        return next;
      });
    },
    [],
  );

  const reorderCustomBackgrounds = useCallback(
    (activeId: string, overId: string) => {
      setCustomBackgrounds((prev) => {
        const oldIndex = prev.findIndex((bg) => bg.id === activeId);
        const newIndex = prev.findIndex((bg) => bg.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }

        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);

        return next;
      });
    },
    [],
  );

  const setOverlayOpacity = useCallback(
    (opacity: number) => {
      updateActiveTuning({ overlayOpacity: Math.max(0, Math.min(100, opacity)) });
    },
    [updateActiveTuning],
  );

  const setBlur = useCallback(
    (blur: number) => {
      updateActiveTuning({ blur: Math.max(0, Math.min(20, blur)) });
    },
    [updateActiveTuning],
  );

  const setPositionX = useCallback(
    (posX: number) => {
      updateActiveTuning({ positionX: Math.max(0, Math.min(100, posX)) });
    },
    [updateActiveTuning],
  );

  const setPositionY = useCallback(
    (posY: number) => {
      updateActiveTuning({ positionY: Math.max(0, Math.min(100, posY)) });
    },
    [updateActiveTuning],
  );

  const setZoom = useCallback(
    (zoom: number) => {
      updateActiveTuning({ zoom: Math.max(100, Math.min(200, zoom)) });
    },
    [updateActiveTuning],
  );

  const setAppThemeColor = useCallback(
    (hue: number) => {
      updateActiveTuning({
        hue: Math.max(0, Math.min(360, Math.round(hue))),
      });
    },
    [updateActiveTuning],
  );

  const resetTheme = useCallback(() => {
    setWallpaperTunings((prev) => ({
      ...prev,
      [activeKey]: DEFAULT_WALLPAPER_TUNING,
    }));
  }, [activeKey]);

  const value: ThemeContextValue = {
    activeBackground,
    allBackgrounds,
    customBackgrounds,
    overlayOpacity: currentTuning.overlayOpacity,
    blur: currentTuning.blur,
    positionX: currentTuning.positionX,
    positionY: currentTuning.positionY,
    zoom: currentTuning.zoom,
    hue: currentTuning.hue,
    selectBackground,
    addCustomBackground,
    renameCustomBackground,
    updateCustomBackground,
    removeCustomBackground,
    moveCustomBackground,
    reorderCustomBackgrounds,
    setOverlayOpacity,
    setBlur,
    setPositionX,
    setPositionY,
    setZoom,
    setAppThemeColor,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
