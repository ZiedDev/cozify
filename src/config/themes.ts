export interface ThemeBackground {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export interface ThemeConfig {
  activeBackgroundId: string | null;
  customBackgrounds: ThemeBackground[];
  overlayOpacity: number; // 0 to 100 (%)
  blur: number; // 0 to 20 (px)
  positionX: number; // 0 to 100 (% horizontal shift)
  positionY: number; // 0 to 100 (% vertical shift)
  zoom: number; // 100 to 200 (% scale)
  hue: number; // 0 to 360 (default 291)
}

export const DEFAULT_HUE = 291;
export const DEFAULT_CHROMA = 0.1;
export const DEFAULT_LIGHTNESS = 71;

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  activeBackgroundId: null, // default clean backdrop
  customBackgrounds: [],
  overlayOpacity: 35,
  blur: 0,
  positionX: 50,
  positionY: 50,
  zoom: 100,
  hue: DEFAULT_HUE,
};

export const PRESET_THEME_COLORS = [
  { name: "Cozify Purple", hue: 291 },
  { name: "Sunset Rose", hue: 15 },
  { name: "Warm Amber", hue: 75 },
  { name: "Emerald Sage", hue: 155 },
  { name: "Ocean Sky", hue: 230 },
  { name: "Neon Violet", hue: 310 },
];

/**
 * Curated Preset Background Wallpapers
 */
export const PRESET_BACKGROUNDS: ThemeBackground[] = [
  {
    id: "tree",
    name: "Tree",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "window",
    name: "window",
    url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "cafe",
    name: "Cafe",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "sea",
    name: "Sea",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop",
  },
];
