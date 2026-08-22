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
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  activeBackgroundId: null, // default clean backdrop
  customBackgrounds: [],
  overlayOpacity: 35,
  blur: 0,
  positionX: 50,
  positionY: 50,
  zoom: 100,
};

/**
 * Curated Preset Background Wallpapers
 * You can easily add, edit, or swap image links here.
 */
export const PRESET_BACKGROUNDS: ThemeBackground[] = [
  {
    id: "cozy-lofi-room",
    name: "Cozy Studio",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "rainy-cafe",
    name: "Rainy Window",
    url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "starry-night",
    name: "Starry Night",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "warm-coffee",
    name: "Warm Coffee",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "foggy-forest",
    name: "Misty Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop",
  },
  {
    id: "sunset-dusk",
    name: "Quiet Dusk",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop",
  },
];
