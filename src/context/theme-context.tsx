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
  DEFAULT_CHROMA,
  DEFAULT_LIGHTNESS,
  PRESET_BACKGROUNDS,
} from "@/config/themes";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

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
  chroma: number;
  lightness: number;
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
  setAppThemeColor: (hue: number, chroma?: number, lightness?: number) => void;
  resetTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = storageAdapter.getItem<ThemeConfig>(
      STORAGE_KEYS.THEME_CONFIG,
      DEFAULT_THEME_CONFIG,
    );

    return {
      ...DEFAULT_THEME_CONFIG,
      ...saved,
    };
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Apply OKLCH palette changes across the entire app
  useEffect(() => {
    const root = document.documentElement;
    const h = config.hue ?? DEFAULT_HUE;
    const c = config.chroma ?? DEFAULT_CHROMA;
    const l = config.lightness ?? DEFAULT_LIGHTNESS;

    if (h === DEFAULT_HUE && c === DEFAULT_CHROMA && l === DEFAULT_LIGHTNESS) {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--focus");
      root.style.removeProperty("--background");
      root.style.removeProperty("--surface");
      root.style.removeProperty("--surface-secondary");
      root.style.removeProperty("--surface-tertiary");
      root.style.removeProperty("--field-background");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--separator");
      root.style.removeProperty("--border");
      root.style.removeProperty("--default");
    } else {
      root.style.setProperty("--accent", `oklch(${l}% ${c} ${h})`);
      root.style.setProperty("--focus", `oklch(${l}% ${c} ${h})`);
      root.style.setProperty(
        "--background",
        `oklch(12% ${Math.min(0.03, c * 0.2)} ${h})`,
      );
      root.style.setProperty(
        "--surface",
        `oklch(21.03% ${Math.min(0.05, c * 0.4)} ${h})`,
      );
      root.style.setProperty(
        "--surface-secondary",
        `oklch(25.7% ${Math.min(0.05, c * 0.3)} ${h})`,
      );
      root.style.setProperty(
        "--surface-tertiary",
        `oklch(27.21% ${Math.min(0.05, c * 0.3)} ${h})`,
      );
      root.style.setProperty(
        "--field-background",
        `oklch(21.03% ${Math.min(0.04, c * 0.3)} ${h})`,
      );
      root.style.setProperty(
        "--muted",
        `oklch(70.5% ${Math.min(0.05, c * 0.4)} ${h})`,
      );
      root.style.setProperty(
        "--separator",
        `oklch(25% ${Math.min(0.03, c * 0.2)} ${h})`,
      );
      root.style.setProperty(
        "--border",
        `oklch(28% ${Math.min(0.03, c * 0.2)} ${h})`,
      );
      root.style.setProperty(
        "--default",
        `oklch(27.4% ${Math.min(0.03, c * 0.2)} ${h})`,
      );
    }
  }, [config.hue, config.chroma, config.lightness]);

  // Sync with storage on config changes
  useEffect(() => {
    storageAdapter.setItem(STORAGE_KEYS.THEME_CONFIG, config);
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

  const setAppThemeColor = useCallback(
    (hue: number, chroma = DEFAULT_CHROMA, lightness = DEFAULT_LIGHTNESS) => {
      setConfig((prev) => ({
        ...prev,
        hue: Math.max(0, Math.min(360, Math.round(hue))),
        chroma: Math.max(0.01, Math.min(0.2, Number(chroma.toFixed(3)))),
        lightness: Math.max(40, Math.min(90, Math.round(lightness))),
      }));
    },
    [],
  );

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
    chroma: config.chroma ?? DEFAULT_CHROMA,
    lightness: config.lightness ?? DEFAULT_LIGHTNESS,
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
