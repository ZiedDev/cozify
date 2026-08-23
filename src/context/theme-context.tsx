import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "@heroui/react";

import {
  ThemeBackground,
  ThemeConfig,
  DEFAULT_THEME_CONFIG,
  DEFAULT_HUE,
  PRESET_BACKGROUNDS,
} from "@/config/themes";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

interface SparseThemeConfig {
  activeBackgroundId?: string | null;
  customBackgrounds?: { id: string; name: string; url: string }[];
  overlayOpacity?: number;
  blur?: number;
  positionX?: number;
  positionY?: number;
  zoom?: number;
  hue?: number;
}

export interface ThemeContextValue {
  activeBackground: ThemeBackground | null;
  allBackgrounds: ThemeBackground[];
  customBackgrounds: ThemeBackground[];
  overlayOpacity: number;
  blur: number;
  positionX: number;
  positionY: number;
  zoom: number;
  hue: number;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
  selectBackground: (bg: ThemeBackground | null) => void;
  addCustomBackground: (name: string, url: string) => boolean;
  renameCustomBackground: (id: string, newName: string) => void;
  removeCustomBackground: (id: string) => void;
  setOverlayOpacity: (opacity: number) => void;
  setBlur: (blur: number) => void;
  setPositionX: (x: number) => void;
  setPositionY: (y: number) => void;
  setZoom: (zoom: number) => void;
  setAppThemeColor: (hue: number) => void;
  resetTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = storageAdapter.getItem<SparseThemeConfig | null>(
      STORAGE_KEYS.THEME_CONFIG,
      null,
    );

    if (!saved) return DEFAULT_THEME_CONFIG;

    return {
      activeBackgroundId:
        saved.activeBackgroundId ?? DEFAULT_THEME_CONFIG.activeBackgroundId,
      customBackgrounds: Array.isArray(saved.customBackgrounds)
        ? saved.customBackgrounds.map((bg) => ({ ...bg, isCustom: true }))
        : [],
      overlayOpacity:
        saved.overlayOpacity ?? DEFAULT_THEME_CONFIG.overlayOpacity,
      blur: saved.blur ?? DEFAULT_THEME_CONFIG.blur,
      positionX: saved.positionX ?? DEFAULT_THEME_CONFIG.positionX,
      positionY: saved.positionY ?? DEFAULT_THEME_CONFIG.positionY,
      zoom: saved.zoom ?? DEFAULT_THEME_CONFIG.zoom,
      hue: saved.hue ?? DEFAULT_THEME_CONFIG.hue,
    };
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Apply OKLCH palette changes across the entire app
  useEffect(() => {
    const root = document.documentElement;
    const h = config.hue ?? DEFAULT_HUE;

    if (h === DEFAULT_HUE) {
      root.style.removeProperty("--theme-hue");
    } else {
      root.style.setProperty("--theme-hue", String(h));
    }
  }, [config.hue]);

  // Sync with storage on config changes (sparse/minimal serialization)
  useEffect(() => {
    const sparse: SparseThemeConfig = {};

    if (config.activeBackgroundId !== DEFAULT_THEME_CONFIG.activeBackgroundId) {
      sparse.activeBackgroundId = config.activeBackgroundId;
    }
    if (config.customBackgrounds && config.customBackgrounds.length > 0) {
      sparse.customBackgrounds = config.customBackgrounds.map((bg) => ({
        id: bg.id,
        name: bg.name,
        url: bg.url,
      }));
    }
    if (config.overlayOpacity !== DEFAULT_THEME_CONFIG.overlayOpacity) {
      sparse.overlayOpacity = config.overlayOpacity;
    }
    if (config.blur !== DEFAULT_THEME_CONFIG.blur) {
      sparse.blur = config.blur;
    }
    if (config.positionX !== DEFAULT_THEME_CONFIG.positionX) {
      sparse.positionX = config.positionX;
    }
    if (config.positionY !== DEFAULT_THEME_CONFIG.positionY) {
      sparse.positionY = config.positionY;
    }
    if (config.zoom !== DEFAULT_THEME_CONFIG.zoom) {
      sparse.zoom = config.zoom;
    }
    if (config.hue !== DEFAULT_THEME_CONFIG.hue) {
      sparse.hue = config.hue;
    }

    if (Object.keys(sparse).length === 0) {
      storageAdapter.removeItem(STORAGE_KEYS.THEME_CONFIG);
    } else {
      storageAdapter.setItem(STORAGE_KEYS.THEME_CONFIG, sparse);
    }
  }, [config]);

  const allBackgrounds = useMemo(() => {
    return [...PRESET_BACKGROUNDS, ...config.customBackgrounds];
  }, [config.customBackgrounds]);

  const activeBackground = useMemo(() => {
    if (!config.activeBackgroundId) return null;

    return (
      allBackgrounds.find((bg) => bg.id === config.activeBackgroundId) || null
    );
  }, [config.activeBackgroundId, allBackgrounds]);

  const selectBackground = useCallback((bg: ThemeBackground | null) => {
    setConfig((prev) => ({
      ...prev,
      activeBackgroundId: bg ? bg.id : null,
    }));
  }, []);

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

      const newBg: ThemeBackground = {
        id: `custom_${Date.now()}`,
        name: trimmedName,
        url: trimmedUrl,
        isCustom: true,
      };

      setConfig((prev) => ({
        ...prev,
        customBackgrounds: [newBg, ...prev.customBackgrounds],
        activeBackgroundId: newBg.id,
      }));

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

    setConfig((prev) => ({
      ...prev,
      customBackgrounds: prev.customBackgrounds.map((bg) =>
        bg.id === id ? { ...bg, name: trimmed } : bg,
      ),
    }));

    toast("Wallpaper Renamed", {
      description: `Updated name to "${trimmed}".`,
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const removeCustomBackground = useCallback((id: string) => {
    setConfig((prev) => {
      const updated = prev.customBackgrounds.filter((bg) => bg.id !== id);
      const newActive =
        prev.activeBackgroundId === id ? null : prev.activeBackgroundId;

      return {
        ...prev,
        customBackgrounds: updated,
        activeBackgroundId: newActive,
      };
    });

    toast("Wallpaper Removed", {
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const setOverlayOpacity = useCallback((opacity: number) => {
    setConfig((prev) => ({
      ...prev,
      overlayOpacity: Math.max(0, Math.min(100, opacity)),
    }));
  }, []);

  const setBlur = useCallback((blur: number) => {
    setConfig((prev) => ({
      ...prev,
      blur: Math.max(0, Math.min(20, blur)),
    }));
  }, []);

  const setPositionX = useCallback((x: number) => {
    setConfig((prev) => ({
      ...prev,
      positionX: Math.max(0, Math.min(100, x)),
    }));
  }, []);

  const setPositionY = useCallback((y: number) => {
    setConfig((prev) => ({
      ...prev,
      positionY: Math.max(0, Math.min(100, y)),
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setConfig((prev) => ({
      ...prev,
      zoom: Math.max(100, Math.min(200, zoom)),
    }));
  }, []);

  const setAppThemeColor = useCallback((hue: number) => {
    setConfig((prev) => ({
      ...prev,
      hue: Math.max(0, Math.min(360, Math.round(hue))),
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setConfig(DEFAULT_THEME_CONFIG);
  }, []);

  const value: ThemeContextValue = {
    activeBackground,
    allBackgrounds,
    customBackgrounds: config.customBackgrounds,
    overlayOpacity: config.overlayOpacity,
    blur: config.blur,
    positionX: config.positionX ?? 50,
    positionY: config.positionY ?? 50,
    zoom: config.zoom ?? 100,
    hue: config.hue ?? DEFAULT_HUE,
    isThemeModalOpen,
    setIsThemeModalOpen,
    selectBackground,
    addCustomBackground,
    renameCustomBackground,
    removeCustomBackground,
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
