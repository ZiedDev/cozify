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
import { db } from "@/services/db";

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
  // 1. Custom Wallpapers list (Persistent in storage & DB)
  const [customBackgrounds, setCustomBackgrounds] = useState<ThemeBackground[]>(
    () => {
      const fromDb = db.customBackgrounds.getAll();

      if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
        return fromDb.map((bg) => ({
          ...bg,
          url: normalizeImageUrl(bg.url),
          isCustom: true,
        }));
      }

      const direct = storageAdapter.getItem<ThemeBackground[] | null>(
        "cozify_custom_wallpapers",
        null,
      );

      if (direct && Array.isArray(direct) && direct.length > 0) {
        return direct.map((bg) => ({
          ...bg,
          url: normalizeImageUrl(bg.url),
          isCustom: true,
        }));
      }

      const saved = storageAdapter.getItem<{
        customBackgrounds?: ThemeBackground[];
      } | null>(STORAGE_KEYS.THEME_CONFIG, null);

      if (saved && Array.isArray(saved.customBackgrounds)) {
        return saved.customBackgrounds.map((bg) => ({
          ...bg,
          url: normalizeImageUrl(bg.url),
          isCustom: true,
        }));
      }

      return [];
    },
  );

  // Listen for remote sync and data reset events to refresh custom wallpapers
  useEffect(() => {
    const refreshWallpapers = () => {
      const bgs = db.customBackgrounds.getAll();

      setCustomBackgrounds(
        bgs.map((bg) => ({
          ...bg,
          url: normalizeImageUrl(bg.url),
          isCustom: true,
        })),
      );
    };

    window.addEventListener("cozify_remote_synced", refreshWallpapers);
    window.addEventListener("cozify_data_reset", refreshWallpapers);

    return () => {
      window.removeEventListener("cozify_remote_synced", refreshWallpapers);
      window.removeEventListener("cozify_data_reset", refreshWallpapers);
    };
  }, []);

  // 2. Active Background ID
  const [activeBackgroundId, setActiveBackgroundId] = useState<string | null>(
    () => {
      return storageAdapter.getItem<string | null>(
        LOCAL_STORAGE_ACTIVE_BG_KEY,
        null,
      );
    },
  );

  // 3. Global App Theme Hue
  const [globalHue, setGlobalHue] = useState<number>(() => {
    return storageAdapter.getItem<number>("cozify_theme_hue", DEFAULT_HUE);
  });

  // 4. Per-Wallpaper Fine-Tuning Map
  const [wallpaperTunings, setWallpaperTunings] = useState<
    Record<string, Partial<WallpaperTuning>>
  >(() => {
    return storageAdapter.getItem<Record<string, Partial<WallpaperTuning>>>(
      LOCAL_STORAGE_WALLPAPER_TUNINGS_KEY,
      {},
    );
  });

  // Sync customBackgrounds to storage
  useEffect(() => {
    storageAdapter.setItem("cozify_custom_wallpapers", customBackgrounds);
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

  // Sync activeBackgroundId to storage
  useEffect(() => {
    storageAdapter.setItem(LOCAL_STORAGE_ACTIVE_BG_KEY, activeBackgroundId);
  }, [activeBackgroundId]);

  // Sync wallpaperTunings map to storage
  useEffect(() => {
    storageAdapter.setItem(
      LOCAL_STORAGE_WALLPAPER_TUNINGS_KEY,
      wallpaperTunings,
    );
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
      hue: globalHue,
    };
  }, [wallpaperTunings, activeKey, globalHue]);

  // Apply OKLCH palette changes across the entire app and persist
  useEffect(() => {
    const root = document.documentElement;

    if (globalHue === DEFAULT_HUE) {
      root.style.removeProperty("--theme-hue");
    } else {
      root.style.setProperty("--theme-hue", String(globalHue));
    }
    storageAdapter.setItem("cozify_theme_hue", globalHue);
  }, [globalHue]);

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

      db.customBackgrounds.save(newBg);
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
      prev.map((bg) => {
        if (bg.id === id) {
          const updated = { ...bg, name: trimmed };

          db.customBackgrounds.save(updated);

          return updated;
        }

        return bg;
      }),
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

          const updated = {
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

          db.customBackgrounds.save(updated);

          return updated;
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

  const removeCustomBackground = useCallback((id: string) => {
    db.customBackgrounds.delete(id);
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
  }, []);

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

        storageAdapter.setItem("cozify_custom_wallpapers", next);
        storageAdapter.setItem(STORAGE_KEYS.THEME_CONFIG, {
          customBackgrounds: next.map((bg) => ({
            id: bg.id,
            name: bg.name,
            url: bg.url,
            isCustom: true,
          })),
        });

        return next;
      });
    },
    [],
  );

  const setOverlayOpacity = useCallback(
    (opacity: number) => {
      updateActiveTuning({
        overlayOpacity: Math.max(0, Math.min(100, opacity)),
      });
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

  const setAppThemeColor = useCallback((hueVal: number) => {
    const clamped = Math.max(0, Math.min(360, Math.round(hueVal)));

    setGlobalHue(clamped);
  }, []);

  const resetTheme = useCallback(() => {
    setGlobalHue(DEFAULT_HUE);
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
