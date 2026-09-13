export type ThemeBackground = {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
};

export type ThemeConfig = {
  activeBackgroundId: string | null;
  customBackgrounds: ThemeBackground[];
  overlayOpacity: number; // 0 to 100 (%)
  blur: number; // 0 to 20 (px)
  positionX: number; // 0 to 100 (% horizontal shift)
  positionY: number; // 0 to 100 (% vertical shift)
  zoom: number; // 100 to 200 (% scale)
  hue: number; // 0 to 360 (default 291)
};

export const DEFAULT_HUE = 291;
export const DEFAULT_CHROMA = 0.1;
export const DEFAULT_LIGHTNESS = 71;
export const DEFAULT_SATURATION = 50;

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
 * Curated Preset Background Wallpapers (Optimized dimensions & compression for low memory)
 */
export const PRESET_BACKGROUNDS: ThemeBackground[] = [
  {
    id: "tree",
    name: "Tree",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "window",
    name: "Window",
    url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "cafe",
    name: "Cafe",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "forest",
    name: "Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "mountain",
    name: "Mountain",
    url: "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=100&w=1920&auto=format&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=30&w=320&auto=format&fit=crop",
  },
  {
    id: "flower",
    name: "flower",
    url: "/wallpapers/full/flower.jpg",
    thumbnail: "/wallpapers/thumbnail/flower.jpg",
  },
  {
    id: "foliage",
    name: "Foliage",
    url: "/wallpapers/full/foliage.jpg",
    thumbnail: "/wallpapers/thumbnail/foliage.jpg",
  },
  {
    id: "sea_foam",
    name: "Sea Foam",
    url: "/wallpapers/full/sea_foam.jpg",
    thumbnail: "/wallpapers/thumbnail/sea_foam.jpg",
  },
  {
    id: "sunset_sea",
    name: "Sunset Sea",
    url: "/wallpapers/full/sunset_sea.jpg",
    thumbnail: "/wallpapers/thumbnail/sunset_sea.jpg",
  },
  {
    id: "sunset_silhouette",
    name: "Sunset Silhouette",
    url: "/wallpapers/full/sunset_silhouette.jpg",
    thumbnail: "/wallpapers/thumbnail/sunset_silhouette.jpg",
  },
];

/**
 * Detects Google Drive photo/image links and converts them to direct viewable CDN URLs.
 */
export function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) return "";

  // 1. Google Drive / Google Docs file sharing link (e.g., /file/d/ID/view...)
  const driveFileMatch = trimmed.match(
    /(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  );

  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // 2. Google Drive open / uc / thumbnail link with id parameter
  const driveParamMatch = trimmed.match(
    /drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
  );

  if (driveParamMatch && driveParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveParamMatch[1]}`;
  }

  // 3. Direct Google user content CDN link
  const googleUserContentMatch = trimmed.match(
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  );

  if (googleUserContentMatch && googleUserContentMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${googleUserContentMatch[1]}`;
  }

  return trimmed;
}
