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
        activeBackgroundId: newBg.id, // auto-apply
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
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
