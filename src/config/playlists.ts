export type MusicPlatform = "youtube" | "spotify";

export type MusicTrack = {
  id: string;
  title: string;
  author?: string;
  duration?: number;
};

export function formatTime(secs: number): string {
  const minutes = Math.floor(secs / 60) || 0;
  const seconds = Math.floor(secs % 60) || 0;

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export type Playlist = {
  id: string;
  title: string;
  author: string;
  platform: MusicPlatform;
  url: string;
  coverUrl?: string;
  category: "lofi" | "synthwave" | "piano" | "ambient" | "spotify" | "custom";
  isLive?: boolean;
  isCustom?: boolean;
  isDeleted?: boolean;
  updatedAt?: number;
  version?: number;
};

export type ParsedMedia = {
  platform: MusicPlatform;
  type: "video" | "playlist" | "track" | "album" | "episode";
  id: string;
  videoId?: string;
  index?: number;
  originalUrl: string;
};

export function parseYouTubeUrl(url: string): ParsedMedia | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  try {
    const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const playlistId = playlistMatch ? playlistMatch[1] : null;

    const videoMatch = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/,
    );
    const videoId = videoMatch ? videoMatch[1] : null;

    const indexMatch = trimmed.match(/[?&]index=(\d+)/);
    const index = indexMatch ? Math.max(0, parseInt(indexMatch[1], 10) - 1) : 0;

    if (playlistId) {
      return {
        platform: "youtube",
        type: "playlist",
        id: playlistId,
        videoId: videoId || undefined,
        index,
        originalUrl: trimmed,
      };
    }
    if (videoId) {
      return {
        platform: "youtube",
        type: "video",
        id: videoId,
        originalUrl: trimmed,
      };
    }
  } catch {
    // ignore parse error
  }

  return null;
}

export function extractSpotifyData(url: string): ParsedMedia | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const typeIndex = parts.findIndex((part) =>
      ["track", "playlist", "album", "artist", "episode"].includes(part),
    );

    if (typeIndex !== -1 && parts[typeIndex + 1]) {
      const type = parts[typeIndex] as
        "track" | "playlist" | "album" | "episode";
      const id = parts[typeIndex + 1].split("?")[0];

      return {
        platform: "spotify",
        type,
        id,
        originalUrl: trimmed,
      };
    }
  } catch {
    // ignore parse error
  }

  return null;
}

export function parseAudioUrl(url: string): ParsedMedia | null {
  return parseYouTubeUrl(url) || extractSpotifyData(url);
}

export async function fetchMediaDetails(url: string): Promise<{
  title: string;
  author: string;
  coverUrl?: string;
  platform: MusicPlatform;
} | null> {
  const parsed = parseAudioUrl(url);

  if (!parsed) return null;

  if (parsed.platform === "spotify") {
    // 1. Spotify OEMBED
    try {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.originalUrl)}`,
      );

      if (res.ok) {
        const data = await res.json();

        return {
          title: data.title || "Spotify Track",
          author: data.author_name || "Spotify",
          coverUrl: data.thumbnail_url,
          platform: "spotify",
        };
      }
    } catch {}

    // 2. NoEmbed fallback for Spotify
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(parsed.originalUrl)}`,
      );

      if (res.ok) {
        const data = await res.json();

        return {
          title: data.title || "Spotify Track",
          author: data.author_name || "Spotify",
          coverUrl: data.thumbnail_url,
          platform: "spotify",
        };
      }
    } catch {}

    return {
      title: `${parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)} on Spotify`,
      author: "Spotify",
      platform: "spotify",
    };
  }

  if (parsed.platform === "youtube") {
    let fallbackCover: string | undefined;
    let targetOEmbedUrl = "";

    if (parsed.type === "playlist") {
      const isMix = parsed.id.startsWith("RD") || parsed.id.startsWith("UL");

      if (parsed.videoId) {
        fallbackCover = `https://img.youtube.com/vi/${parsed.videoId}/maxresdefault.jpg`;
      }

      if (isMix && parsed.videoId) {
        targetOEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.videoId}&format=json`;
      } else {
        targetOEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${parsed.id}&format=json`;
      }
    } else {
      const vidId = parsed.id;

      fallbackCover = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
      targetOEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`;
    }

    // Attempt YouTube oEmbed
    const details =
      (await fetchOEmbed(targetOEmbedUrl, fallbackCover)) ||
      (parsed.type === "playlist" && parsed.videoId
        ? await fetchOEmbed(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.videoId}&format=json`,
            fallbackCover,
          )
        : null) ||
      (await fetchOEmbed(
        `https://noembed.com/embed?url=${encodeURIComponent(
          parsed.videoId
            ? `https://www.youtube.com/watch?v=${parsed.videoId}`
            : parsed.originalUrl,
        )}`,
        fallbackCover,
      ));

    if (details) return details;

    return {
      title: parsed.type === "playlist" ? "YouTube Playlist" : "YouTube Audio",
      author: "YouTube",
      coverUrl: fallbackCover,
      platform: "youtube",
    };
  }

  return null;
}

async function fetchOEmbed(
  url: string,
  fallbackCover?: string,
): Promise<{
  title: string;
  author: string;
  coverUrl?: string;
  platform: MusicPlatform;
} | null> {
  try {
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();

      return {
        title: data.title || "YouTube Audio",
        author: data.author_name || "YouTube",
        coverUrl: data.thumbnail_url || fallbackCover,
        platform: "youtube",
      };
    }
  } catch {}

  return null;
}

export const PRESET_PLAYLISTS: Playlist[] = [
  {
    id: "preset-radios",
    title: "📻 Lofi Girl - Radios",
    author: "Lofi Girl",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=rFZHOHl-L8A&list=PL6NdkXsPL07Il2hEQGcLI4dg_LTg7xA2L",
    coverUrl: "https://img.youtube.com/vi/rFZHOHl-L8A/maxresdefault.jpg",
    category: "lofi",
  },
  {
    id: "preset-study-sessions",
    title: "Study Sessions 📚 lofi music to focus to",
    author: "Lofi Girl",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=lTRiuFIWV54&list=PL6NdkXsPL07LBOz-XhgCJJGlI4jarMKzp",
    coverUrl: "https://img.youtube.com/vi/lTRiuFIWV54/maxresdefault.jpg",
    category: "lofi",
  },
  {
    id: "preset-ambiences",
    title: "🌙 Lofi Girl - Ambiences",
    author: "Lofi Girl",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=ZwJ0pY6sXoY&list=PL6NdkXsPL07Jn_YpyMkADfZ49MHPZoqEQ",
    coverUrl: "https://img.youtube.com/vi/ZwJ0pY6sXoY/maxresdefault.jpg",
    category: "ambient",
  },
];
