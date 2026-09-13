import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { toast } from "@heroui/react";

import {
  Playlist,
  MusicTrack,
  MusicPlatform,
  PRESET_PLAYLISTS,
  parseAudioUrl,
  parseYouTubeUrl,
  fetchMediaDetails,
} from "@/config/playlists";
import { storageAdapter } from "@/services/storage";

const MUSIC_STORAGE_KEY = "cozify_music_state";
const CUSTOM_PLAYLISTS_STORAGE_KEY = "cozify_custom_playlists";

/**
 * Maps a linear UI slider value (0..100) to actual player volume (0..100)
 * using a quadratic perceptual loudness curve. This gives a natural response
 * across the entire slider range instead of being too loud at low percentages.
 */
export const toActualVolume = (sliderVal: number): number => {
  if (sliderVal <= 0) return 0;
  if (sliderVal >= 100) return 100;

  return Math.round(100 * Math.pow(sliderVal / 100, 2));
};

type SavedMusicState = {
  activeUrl: string;
  activePlatform: MusicPlatform;
  title: string;
  author: string;
  posterUrl?: string;
  isLive?: boolean;
  volume: number;
  activePlaylistId?: string;
  currentTrackIndex?: number;
  tracklist?: MusicTrack[];
  currentTime?: number;
};

type MusicContextValue = {
  activeUrl: string;
  activePlatform: MusicPlatform;
  title: string;
  author: string;
  posterUrl: string;
  isLive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  isOnline: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  activePlaylistId: string | null;
  tracklist: MusicTrack[];
  currentTrackIndex: number;
  customPlaylists: Playlist[];
  isDeckOpen: boolean;
  isPickerOpen: boolean;
  isReady: boolean;
  isPosterHidden: boolean;
  spotifyEmbedUrl: string | null;
  currentPlayingUrl: string;
  playerKey: number;

  setIsDeckOpen: (open: boolean) => void;
  setIsPickerOpen: (open: boolean) => void;
  toggleDeck: () => void;
  togglePicker: () => void;
  togglePosterPreview: () => void;
  retryPlayer: (reason?: string) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number, shouldContinuePlaying?: boolean) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;

  nextTrack: () => void;
  prevTrack: () => void;
  playTrackAt: (index: number) => void;

  loadUrl: (
    url: string,
    title?: string,
    author?: string,
    autoPlay?: boolean,
    playlistId?: string | null,
  ) => boolean;
  playPlaylist: (playlist: Playlist) => void;

  addCustomPlaylist: (url: string) => Promise<boolean>;
  removeCustomPlaylist: (id: string) => void;
  renameCustomPlaylist: (id: string, newTitle: string) => void;
  moveCustomPlaylist: (id: string, direction: "up" | "down") => void;
  reorderCustomPlaylists: (activeId: string, overId: string) => void;

  bindYTPlayerElement: (el: HTMLDivElement | null) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function MusicProvider({ children }: { children: ReactNode }) {
  // Synchronously hydrate initial saved state
  const initialSaved = useMemo(() => {
    return storageAdapter.getItem<SavedMusicState | null>(
      MUSIC_STORAGE_KEY,
      null,
    );
  }, []);

  const defaultUrl = PRESET_PLAYLISTS[0].url;
  const initialMedia = useMemo(() => {
    return parseAudioUrl(initialSaved?.activeUrl || defaultUrl);
  }, [initialSaved, defaultUrl]);

  const [activeUrl, setActiveUrl] = useState<string>(
    () => initialSaved?.activeUrl || PRESET_PLAYLISTS[0].url,
  );
  const [activePlatform, setActivePlatform] = useState<MusicPlatform>(
    () => initialSaved?.activePlatform || initialMedia?.platform || "youtube",
  );
  const [title, setTitle] = useState<string>(
    () => initialSaved?.title || PRESET_PLAYLISTS[0].title,
  );
  const [author, setAuthor] = useState<string>(
    () => initialSaved?.author || PRESET_PLAYLISTS[0].author,
  );
  const [posterUrl, setPosterUrl] = useState<string>(
    () => initialSaved?.posterUrl || PRESET_PLAYLISTS[0].coverUrl || "",
  );
  const [isLive, setIsLive] = useState<boolean>(
    () => initialSaved?.isLive ?? false,
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(
    () => initialSaved?.volume ?? 80,
  );
  const lastNonZeroVolumeRef = useRef<number>(
    initialSaved?.volume && initialSaved.volume > 0 ? initialSaved.volume : 80,
  );
  const [currentTime, setCurrentTime] = useState<number>(
    () => initialSaved?.currentTime || 0,
  );
  const [duration, setDuration] = useState<number>(0);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    () => initialSaved?.activePlaylistId ?? PRESET_PLAYLISTS[0].id,
  );
  const [tracklist, setTracklist] = useState<MusicTrack[]>(
    () => initialSaved?.tracklist || [],
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(
    () => initialSaved?.currentTrackIndex || 0,
  );
  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    const parsed = parseYouTubeUrl(
      initialSaved?.activeUrl || PRESET_PLAYLISTS[0].url,
    );

    return parsed?.type === "video"
      ? parsed.id
      : parsed?.videoId || "rFZHOHl-L8A";
  });
  const [isPosterHidden, setIsPosterHidden] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const isOnlineRef = useRef<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  isOnlineRef.current = isOnline;

  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => {
    return storageAdapter.getItem<Playlist[]>(CUSTOM_PLAYLISTS_STORAGE_KEY, []);
  });

  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [playerKey, setPlayerKey] = useState<number>(0);

  const playerRef = useRef<any>(null);
  const isReadyRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isBufferingRef = useRef<boolean>(false);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const progressTimerRef = useRef<any>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const lastKnownVideoIdRef = useRef<string>(currentVideoId || "");
  const currentVideoIdsRef = useRef<string[]>([]);
  const mediaTypeRef = useRef<"video" | "playlist" | "spotify">(
    initialMedia?.platform === "spotify"
      ? "spotify"
      : initialMedia?.type === "playlist"
        ? "playlist"
        : "video",
  );
  const targetFirstVideoIdRef = useRef<string>(
    initialMedia?.platform === "youtube"
      ? initialMedia.type === "playlist"
        ? initialMedia.videoId || ""
        : initialMedia.id
      : "",
  );
  const trackMetaCacheRef = useRef<
    Map<string, { title: string; author: string }>
  >(new Map());

  // Mutable refs keeping the active playback state always fresh for async watchdog & player events
  const activeUrlRef = useRef<string>(activeUrl);

  activeUrlRef.current = activeUrl;
  const volumeRef = useRef<number>(volume);

  volumeRef.current = volume;
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);

  currentTrackIndexRef.current = currentTrackIndex;
  const currentVideoIdRef = useRef<string>(currentVideoId);

  currentVideoIdRef.current = currentVideoId;
  const currentTimeRef = useRef<number>(currentTime);

  currentTimeRef.current = currentTime;

  const bufferingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const retryCountRef = useRef<number>(0);
  const lastRetryTimeRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const WATCHDOG_TIMEOUT_MS = 8000;

  const setBuffering = useCallback((buffering: boolean) => {
    isBufferingRef.current = buffering;
    setIsBuffering(buffering);
  }, []);

  // Cancel any active buffering watchdog timer
  const clearBufferingWatchdog = useCallback(() => {
    if (bufferingWatchdogRef.current) {
      clearTimeout(bufferingWatchdogRef.current);
      bufferingWatchdogRef.current = null;
    }
  }, []);

  // Sync custom playlists to storage
  useEffect(() => {
    storageAdapter.setItem(CUSTOM_PLAYLISTS_STORAGE_KEY, customPlaylists);
  }, [customPlaylists]);

  // Sync active audio state to storage
  useEffect(() => {
    const savedState: SavedMusicState = {
      activeUrl,
      activePlatform,
      title,
      author,
      posterUrl,
      isLive,
      volume,
      activePlaylistId: activePlaylistId || undefined,
      currentTrackIndex,
      tracklist: tracklist.slice(0, 80),
      currentTime,
    };

    storageAdapter.setItem(MUSIC_STORAGE_KEY, savedState);
  }, [
    activeUrl,
    activePlatform,
    title,
    author,
    posterUrl,
    isLive,
    volume,
    activePlaylistId,
    currentTrackIndex,
    tracklist,
    currentTime,
  ]);

  // Initial offline check and event listeners for network transitions
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;

      setIsOnline(online);
      isOnlineRef.current = online;
      if (!online) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setBuffering(false);
      }
    };

    updateOnlineStatus();

    const handleOffline = () => {
      setIsOnline(false);
      isOnlineRef.current = false;
      clearBufferingWatchdog();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setBuffering(false);
      pendingActionRef.current = null;

      try {
        if (
          playerRef.current &&
          typeof playerRef.current.pauseVideo === "function"
        ) {
          playerRef.current.pauseVideo();
        }
      } catch {}

      toast("Offline Mode", {
        description:
          "You are currently offline. Music player is paused and disabled.",
        variant: "danger",
        timeout: 3500,
      });
    };

    const handleOnline = () => {
      setIsOnline(true);
      isOnlineRef.current = true;

      toast("Back Online 🌐", {
        description: "Reconnected. Re-adding and refreshing music player...",
        variant: "accent",
        timeout: 3000,
      });

      // If YouTube API script was not loaded yet, remove any failed script tag
      if (!window.YT || !window.YT.Player) {
        const oldScript = document.getElementById("yt-iframe-api");

        if (oldScript) {
          oldScript.remove();
        }
      }

      // Safely tear down existing player instance to prepare for fresh re-attachment
      try {
        if (playerRef.current) {
          playerRef.current.destroy?.();
        }
      } catch {}
      playerRef.current = null;
      isReadyRef.current = false;
      setIsReady(false);
      setBuffering(false);

      // Increment playerKey to trigger container & iframe remounting
      setPlayerKey((prevKey) => prevKey + 1);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [clearBufferingWatchdog, setBuffering]);

  // Derive Spotify Embed URL
  const spotifyEmbedUrl = useMemo(() => {
    if (activePlatform !== "spotify") return null;
    const parsed = parseAudioUrl(activeUrl);

    if (parsed && parsed.platform === "spotify") {
      return `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
    }

    return null;
  }, [activePlatform, activeUrl]);

  // Dynamically compute current track URL
  const currentPlayingUrl = useMemo(() => {
    if (activePlatform === "spotify") return activeUrl;
    const vidId =
      currentVideoId ||
      tracklist[currentTrackIndex]?.id ||
      lastKnownVideoIdRef.current;

    if (vidId) {
      const parsed = parseYouTubeUrl(activeUrl);

      if (parsed?.type === "playlist" && parsed.id) {
        return `https://www.youtube.com/watch?v=${vidId}&list=${parsed.id}&index=${currentTrackIndex + 1}`;
      }

      return `https://www.youtube.com/watch?v=${vidId}`;
    }

    return activeUrl;
  }, [activePlatform, currentVideoId, tracklist, currentTrackIndex, activeUrl]);

  // Check if player iframe is valid
  const isPlayerAttached = useCallback(() => {
    if (!playerRef.current || !isReadyRef.current) return false;
    try {
      const iframe =
        typeof playerRef.current.getIframe === "function"
          ? playerRef.current.getIframe()
          : null;

      return Boolean(
        iframe &&
          iframe.isConnected &&
          document.documentElement.contains(iframe),
      );
    } catch {
      return false;
    }
  }, []);

  // Multi-tier metadata fetching
  const fetchMetadata = useCallback(async (videoId: string) => {
    if (!videoId) return;
    lastKnownVideoIdRef.current = videoId;
    setCurrentVideoId(videoId);
    setPosterUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);

    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      );

      if (res.ok) {
        const data = await res.json();

        if (data.title) setTitle(data.title);
        if (data.author_name) setAuthor(data.author_name);

        return;
      }
    } catch {}

    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      );
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.author_name) setAuthor(data.author_name);
    } catch {}
  }, []);

  const fetchSingleTrackMeta = useCallback(
    async (vidId: string): Promise<{ title?: string; author?: string }> => {
      if (trackMetaCacheRef.current.has(vidId)) {
        return trackMetaCacheRef.current.get(vidId)!;
      }

      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`,
        );

        if (res.ok) {
          const data = await res.json();

          if (data.title) {
            const meta = {
              title: data.title,
              author: data.author_name || "",
            };

            trackMetaCacheRef.current.set(vidId, meta);

            return meta;
          }
        }
      } catch {}

      try {
        const res = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vidId}`,
        );

        if (res.ok) {
          const data = await res.json();

          if (data.title) {
            const meta = {
              title: data.title,
              author: data.author_name || "",
            };

            trackMetaCacheRef.current.set(vidId, meta);

            return meta;
          }
        }
      } catch {}

      return {};
    },
    [],
  );

  const populatePlaylistTracks = useCallback(
    (videoIds: string[]) => {
      if (mediaTypeRef.current !== "playlist") return;
      if (!videoIds || videoIds.length === 0) return;

      const idsKey = videoIds.join(",");
      const prevIdsKey = currentVideoIdsRef.current.join(",");

      // Avoid re-fetching and overwriting resolved track titles if same playlist
      if (
        idsKey === prevIdsKey &&
        tracklist.length === videoIds.length &&
        tracklist.some((track) => !track.title.startsWith("Track "))
      ) {
        return;
      }

      currentVideoIdsRef.current = videoIds;

      const initialTracks: MusicTrack[] = videoIds.map((id, idx) => {
        const cached = trackMetaCacheRef.current.get(id);

        return {
          id,
          title: cached?.title || `Track ${idx + 1}`,
          author: cached?.author || "Loading...",
        };
      });

      setTracklist(initialTracks);

      const batchSize = 4;
      let currentOffset = 0;

      const processBatches = async () => {
        while (currentOffset < videoIds.length) {
          if (currentVideoIdsRef.current.join(",") !== idsKey) return;

          const chunk = videoIds.slice(
            currentOffset,
            currentOffset + batchSize,
          );
          const startIdx = currentOffset;

          currentOffset += batchSize;

          const results = await Promise.all(
            chunk.map((vidId) => fetchSingleTrackMeta(vidId)),
          );

          if (currentVideoIdsRef.current.join(",") !== idsKey) return;

          setTracklist((prev) =>
            prev.map((track, trackIndex) => {
              const relIdx = trackIndex - startIdx;

              if (relIdx >= 0 && relIdx < results.length) {
                const meta = results[relIdx];

                if (meta?.title) {
                  return {
                    ...track,
                    title: meta.title,
                    author: meta.author || "",
                  };
                }
              }

              return track;
            }),
          );

          if (currentOffset < videoIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }
      };

      processBatches();
    },
    [fetchSingleTrackMeta, tracklist],
  );

  // Sync track metadata from active player instance
  const syncPlayerTrackMeta = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const data =
        typeof playerRef.current.getVideoData === "function"
          ? playerRef.current.getVideoData()
          : null;
      const currentVidId = data ? data.video_id : "";

      const isNewTrack = Boolean(
        currentVidId && currentVidId !== lastKnownVideoIdRef.current,
      );

      if (isNewTrack) {
        lastKnownVideoIdRef.current = currentVidId;
        setCurrentVideoId(currentVidId);
        setCurrentTime(0);
        currentTimeRef.current = 0;
        try {
          playerRef.current.seekTo(0, true);
        } catch {}
        setPosterUrl(
          `https://img.youtube.com/vi/${currentVidId}/hqdefault.jpg`,
        );
        if (data.title) setTitle(data.title);
        if (
          data.author &&
          data.author.trim() !== "" &&
          !data.author.toLowerCase().includes("playlist")
        ) {
          setAuthor(data.author);
        } else {
          fetchMetadata(currentVidId);
        }
      }

      if (typeof playerRef.current.getPlaylistIndex === "function") {
        const idx = playerRef.current.getPlaylistIndex();

        if (idx !== -1) {
          setCurrentTrackIndex(idx);
        }
      }

      if (typeof playerRef.current.getDuration === "function") {
        const dur = playerRef.current.getDuration() || 0;

        if (dur > 0) {
          setDuration(dur);
          const live = data?.isLive === true || dur > 43200;

          setIsLive(live);
        }
      }
      if (
        !isNewTrack &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const cur = playerRef.current.getCurrentTime() || 0;

        setCurrentTime(cur);
      }
    } catch {}
  }, [fetchMetadata, setCurrentTime]);

  // Timeline scrubber update loop
  const startTimeline = useCallback(() => {
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      if (!playerRef.current || !isReadyRef.current) return;
      try {
        if (typeof playerRef.current.getCurrentTime !== "function") return;
        const vData =
          typeof playerRef.current.getVideoData === "function"
            ? playerRef.current.getVideoData()
            : {};

        if (vData?.video_id && vData.video_id !== lastKnownVideoIdRef.current) {
          syncPlayerTrackMeta();

          return;
        }

        const cur = playerRef.current.getCurrentTime() || 0;
        const dur =
          typeof playerRef.current.getDuration === "function"
            ? playerRef.current.getDuration() || 0
            : 0;

        const live = vData?.isLive === true || (dur > 43200 && isFinite(dur));

        setIsLive(live);
        setCurrentTime(cur);
        if (dur > 0) {
          setDuration(dur);
        }
      } catch {}
    }, 250);
  }, [syncPlayerTrackMeta, setCurrentTime]);

  // Re-render and re-instantiate the YouTube iframe if stuck buffering or broken
  const retryPlayer = useCallback(
    (_reason: string = "buffering_timeout") => {
      clearBufferingWatchdog();

      if (activePlatform !== "youtube") return;

      const now = Date.now();

      if (now - lastRetryTimeRef.current < 2000) return;
      lastRetryTimeRef.current = now;

      if (retryCountRef.current >= MAX_RETRIES) {
        setBuffering(false);
        setIsPlaying(false);
        isPlayingRef.current = false;
        toast("Playback Error", {
          description:
            "Audio stream got stuck and couldn't recover. Please try another track.",
          variant: "danger",
        });

        return;
      }

      retryCountRef.current += 1;
      const attempt = retryCountRef.current;

      toast("Reloading Player 🔄", {
        description: `Stream took too long to load. Retrying (${attempt}/${MAX_RETRIES})...`,
        variant: "default",
        timeout: 2500,
      });

      // Safely destroy existing player instance
      try {
        if (playerRef.current) {
          playerRef.current.destroy?.();
        }
      } catch {}
      playerRef.current = null;
      isReadyRef.current = false;
      setIsReady(false);
      setBuffering(true);

      // Preserve playing state and queue auto-play upon ready
      isPlayingRef.current = true;
      setIsPlaying(true);
      pendingActionRef.current = () => {
        try {
          playerRef.current?.unMute?.();
          playerRef.current?.playVideo?.();
        } catch {}
      };

      // Trigger container element remount with new key
      setPlayerKey((prevKey) => prevKey + 1);

      // Arm watchdog for this retry attempt as well
      bufferingWatchdogRef.current = setTimeout(() => {
        if (
          isBufferingRef.current ||
          (isPlayingRef.current && !isReadyRef.current)
        ) {
          retryPlayer("retry_timeout");
        }
      }, WATCHDOG_TIMEOUT_MS);
    },
    [activePlatform, clearBufferingWatchdog, setBuffering],
  );

  // Arm the watchdog to trigger retryPlayer if buffering persists for > 8s
  const startBufferingWatchdog = useCallback(() => {
    clearBufferingWatchdog();

    if (activePlatform !== "youtube") return;

    bufferingWatchdogRef.current = setTimeout(() => {
      if (
        isBufferingRef.current ||
        (isPlayingRef.current && (!isReadyRef.current || !isPlayerAttached()))
      ) {
        retryPlayer("watchdog_timeout");
      }
    }, WATCHDOG_TIMEOUT_MS);
  }, [activePlatform, clearBufferingWatchdog, isPlayerAttached, retryPlayer]);

  // Clean up timers & player on unmount
  useEffect(() => {
    return () => {
      clearBufferingWatchdog();
      clearInterval(progressTimerRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [clearBufferingWatchdog]);

  // Initialize YouTube Iframe API Player
  const initYTPlayer = useCallback(() => {
    if (!isOnlineRef.current) return;
    if (!ytContainerRef.current || playerRef.current) return;

    const createPlayer = () => {
      if (!ytContainerRef.current || playerRef.current || !window.YT?.Player) {
        return;
      }

      const currentUrl = activeUrlRef.current;
      const ytData = parseYouTubeUrl(currentUrl);
      const initialVid =
        currentVideoIdRef.current ||
        (ytData?.type === "video"
          ? ytData.id
          : ytData?.videoId || "rFZHOHl-L8A");

      try {
        playerRef.current = new window.YT.Player(ytContainerRef.current, {
          host: "https://www.youtube-nocookie.com",
          videoId: initialVid,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
            widget_referrer:
              typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event: any) => {
              isReadyRef.current = true;
              setIsReady(true);
              try {
                event.target.setVolume(toActualVolume(volumeRef.current));
                if (event.target.setPlaybackQuality) {
                  event.target.setPlaybackQuality("small");
                }
              } catch {}

              startTimeline();

              if (pendingActionRef.current) {
                const action = pendingActionRef.current;

                pendingActionRef.current = null;
                action();
              } else if (
                mediaTypeRef.current === "playlist" ||
                ytData?.type === "playlist"
              ) {
                mediaTypeRef.current = "playlist";
                targetFirstVideoIdRef.current = ytData?.videoId || "";
                const targetIdx =
                  currentTrackIndexRef.current ?? ytData?.index ?? 0;
                const playlistId = ytData?.id;

                if (playlistId) {
                  const cueOpts: any = {
                    list: playlistId,
                    index: targetIdx,
                    suggestedQuality: "small",
                  };

                  if (
                    !playlistId.startsWith("RD") &&
                    !playlistId.startsWith("UL")
                  ) {
                    cueOpts.listType = "playlist";
                  }

                  try {
                    if (isPlayingRef.current) {
                      startBufferingWatchdog();
                      if (typeof event.target.loadPlaylist === "function") {
                        event.target.loadPlaylist(cueOpts);
                      } else {
                        event.target.cuePlaylist(cueOpts);
                      }
                      setTimeout(() => {
                        try {
                          event.target?.unMute?.();
                          event.target?.playVideo?.();
                        } catch {}
                      }, 50);
                    } else {
                      event.target.cuePlaylist(cueOpts);
                    }
                  } catch {}

                  let attempts = 0;
                  const pollPlaylist = setInterval(() => {
                    attempts++;
                    const list = event.target?.getPlaylist?.();

                    if (list && Array.isArray(list) && list.length > 0) {
                      populatePlaylistTracks(list);
                      clearInterval(pollPlaylist);
                    } else if (attempts > 30) {
                      clearInterval(pollPlaylist);
                    }
                  }, 250);
                }
              } else if (initialVid) {
                mediaTypeRef.current = "video";
                targetFirstVideoIdRef.current = "";
                fetchMetadata(initialVid);
                if (isPlayingRef.current) {
                  startBufferingWatchdog();
                  try {
                    const startSec =
                      retryCountRef.current > 0 && currentTimeRef.current > 2
                        ? currentTimeRef.current
                        : 0;

                    if (typeof event.target.loadVideoById === "function") {
                      event.target.loadVideoById({
                        videoId: initialVid,
                        startSeconds: startSec,
                        suggestedQuality: "small",
                      });
                    }
                    setTimeout(() => {
                      try {
                        event.target?.unMute?.();
                        event.target?.playVideo?.();
                      } catch {}
                    }, 50);
                  } catch {}
                }
              }
            },
            onStateChange: (event: any) => {
              syncPlayerTrackMeta();

              if (mediaTypeRef.current === "playlist") {
                const list = event.target?.getPlaylist?.();

                if (list && Array.isArray(list) && list.length > 0) {
                  const matchesTarget = targetFirstVideoIdRef.current
                    ? list.includes(targetFirstVideoIdRef.current)
                    : true;

                  if (matchesTarget) {
                    populatePlaylistTracks(list);
                  }
                }
              }

              if (event.data === window.YT.PlayerState.PLAYING) {
                retryCountRef.current = 0;
                clearBufferingWatchdog();
                isPlayingRef.current = true;
                setIsPlaying(true);
                setBuffering(false);
                startTimeline();
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                setBuffering(true);
                startBufferingWatchdog();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                clearBufferingWatchdog();
                isPlayingRef.current = false;
                setIsPlaying(false);
                setBuffering(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                clearBufferingWatchdog();
                isPlayingRef.current = false;
                setIsPlaying(false);
                setBuffering(false);
              } else if (event.data === window.YT.PlayerState.CUED) {
                setBuffering(false);
                if (isPlayingRef.current) {
                  startBufferingWatchdog();
                  try {
                    event.target?.unMute?.();
                    event.target?.playVideo?.();
                  } catch {}
                } else {
                  clearBufferingWatchdog();
                  setIsPlaying(false);
                }
              } else if (event.data === -1) {
                // UNSTARTED
                if (isPlayingRef.current) {
                  setBuffering(true);
                  startBufferingWatchdog();
                  try {
                    event.target?.unMute?.();
                    event.target?.playVideo?.();
                  } catch {}
                } else {
                  clearBufferingWatchdog();
                }
              }
            },
            onError: (event: any) => {
              const errCode = event?.data;

              if (errCode === 101 || errCode === 150) {
                clearBufferingWatchdog();
                isPlayingRef.current = false;
                setIsPlaying(false);
                setBuffering(false);
                toast("Playback Restricted", {
                  description:
                    "This video cannot be played in embedded players.",
                  variant: "danger",
                });
              } else if (errCode === 100) {
                clearBufferingWatchdog();
                isPlayingRef.current = false;
                setIsPlaying(false);
                setBuffering(false);
                toast("Video Unavailable", {
                  description: "This video was removed or marked private.",
                  variant: "danger",
                });
              } else {
                retryPlayer("player_error_" + errCode);
              }
            },
          },
        });
      } catch {
        setTimeout(createPlayer, 300);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Remove any previously failed or stale script tag before re-requesting
      const existingScript = document.getElementById("yt-iframe-api");

      if (existingScript) {
        existingScript.remove();
      }

      const tag = document.createElement("script");

      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;

      const pollTimer = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollTimer);
          createPlayer();
        }
      }, 150);

      const oldCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof oldCallback === "function") oldCallback();
        createPlayer();
      };

      tag.onerror = () => {
        clearInterval(pollTimer);
        tag.remove();
        setIsOnline(false);
        isOnlineRef.current = false;
        isPlayingRef.current = false;
        setIsPlaying(false);
        setBuffering(false);
      };

      document.head.appendChild(tag);
    }
  }, [
    fetchMetadata,
    syncPlayerTrackMeta,
    startTimeline,
    populatePlaylistTracks,
    clearBufferingWatchdog,
    startBufferingWatchdog,
    retryPlayer,
    setBuffering,
  ]);

  const bindYTPlayerElement = useCallback(
    (el: HTMLDivElement | null) => {
      ytContainerRef.current = el;
      if (!el) {
        if (playerRef.current) {
          try {
            playerRef.current.destroy?.();
          } catch {}
          playerRef.current = null;
          isReadyRef.current = false;
          setIsReady(false);
        }

        return;
      }

      if (isOnlineRef.current && (!playerRef.current || !isPlayerAttached())) {
        initYTPlayer();
      }
    },
    [initYTPlayer, isPlayerAttached],
  );

  const play = useCallback(() => {
    if (!isOnlineRef.current) {
      toast("Offline Mode", {
        description: "Cannot start music playback while offline.",
        variant: "danger",
        timeout: 2500,
      });

      return;
    }

    if (activePlatform === "youtube") {
      setBuffering(true);
      isPlayingRef.current = true;
      retryCountRef.current = 0;
      startBufferingWatchdog();

      const executePlay = () => {
        if (!playerRef.current) return;
        try {
          if (typeof playerRef.current.playVideo === "function") {
            playerRef.current.unMute?.();
            playerRef.current.playVideo();
          }
        } catch {}
      };

      if (isPlayerAttached() && isReadyRef.current) {
        executePlay();
      } else {
        pendingActionRef.current = executePlay;
        if (!playerRef.current && ytContainerRef.current) {
          initYTPlayer();
        }
      }
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setBuffering(false);
    }
  }, [
    activePlatform,
    isPlayerAttached,
    startBufferingWatchdog,
    initYTPlayer,
    setBuffering,
  ]);

  const pause = useCallback(() => {
    clearBufferingWatchdog();
    pendingActionRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setBuffering(false);
    retryCountRef.current = 0;
    if (
      activePlatform === "youtube" &&
      isPlayerAttached() &&
      playerRef.current?.pauseVideo
    ) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    }
  }, [activePlatform, isPlayerAttached, clearBufferingWatchdog, setBuffering]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seekTo = useCallback(
    (seconds: number, shouldContinuePlaying?: boolean) => {
      if (
        playerRef.current &&
        isReadyRef.current &&
        typeof playerRef.current.seekTo === "function"
      ) {
        try {
          playerRef.current.seekTo(seconds, true);
          setCurrentTime(seconds);
          currentTimeRef.current = seconds;
          if (shouldContinuePlaying ?? isPlayingRef.current) {
            playerRef.current.playVideo?.();
            isPlayingRef.current = true;
            setIsPlaying(true);
          }
        } catch {}
      }
    },
    [],
  );

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(100, vol));

      if (clamped > 0) {
        lastNonZeroVolumeRef.current = clamped;
      }

      setVolumeState(clamped);
      if (isPlayerAttached() && playerRef.current?.setVolume) {
        try {
          playerRef.current.setVolume(toActualVolume(clamped));
        } catch {}
      }
    },
    [isPlayerAttached],
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      lastNonZeroVolumeRef.current = volume;
      setVolume(0);
    } else {
      const restore =
        lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 80;

      setVolume(restore);
    }
  }, [volume, setVolume]);

  const nextTrack = useCallback(() => {
    if (tracklist.length <= 1) return;
    if (isPlayerAttached() && playerRef.current?.nextVideo) {
      try {
        retryCountRef.current = 0;
        setBuffering(true);
        startBufferingWatchdog();
        setCurrentTime(0);
        currentTimeRef.current = 0;
        playerRef.current.nextVideo();
        try {
          playerRef.current.seekTo(0, true);
        } catch {}
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {}
    }
  }, [
    isPlayerAttached,
    tracklist.length,
    startBufferingWatchdog,
    setBuffering,
    setCurrentTime,
  ]);

  const prevTrack = useCallback(() => {
    if (tracklist.length <= 1) return;
    if (isPlayerAttached() && playerRef.current?.previousVideo) {
      try {
        retryCountRef.current = 0;
        setBuffering(true);
        startBufferingWatchdog();
        setCurrentTime(0);
        currentTimeRef.current = 0;
        playerRef.current.previousVideo();
        try {
          playerRef.current.seekTo(0, true);
        } catch {}
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {}
    }
  }, [
    isPlayerAttached,
    tracklist.length,
    startBufferingWatchdog,
    setBuffering,
    setCurrentTime,
  ]);

  const playTrackAt = useCallback(
    (index: number) => {
      if (isPlayerAttached() && playerRef.current?.playVideoAt) {
        try {
          retryCountRef.current = 0;
          setBuffering(true);
          startBufferingWatchdog();
          setCurrentTime(0);
          currentTimeRef.current = 0;
          playerRef.current.playVideoAt(index);
          try {
            playerRef.current.seekTo(0, true);
          } catch {}
          setCurrentTrackIndex(index);
          isPlayingRef.current = true;
          setIsPlaying(true);
        } catch {}
      }
    },
    [isPlayerAttached, startBufferingWatchdog, setBuffering, setCurrentTime],
  );

  const loadUrl = useCallback(
    (
      url: string,
      customTitle?: string,
      customAuthor?: string,
      autoPlay: boolean = true,
      playlistId?: string | null,
    ): boolean => {
      const trimmed = url.trim();
      const parsed = parseAudioUrl(trimmed);

      if (!parsed) {
        toast("Unsupported URL", {
          description:
            "Please enter a valid YouTube (video or playlist) or Spotify link.",
          variant: "danger",
        });

        return false;
      }

      setActiveUrl(trimmed);
      activeUrlRef.current = trimmed;
      setActivePlatform(parsed.platform);

      if (playlistId !== undefined) {
        setActivePlaylistId(playlistId);
      } else {
        const matching = [...customPlaylists, ...PRESET_PLAYLISTS].find(
          (playlist) => {
            if (playlist.url === trimmed) return true;
            if (parsed.videoId && playlist.url.includes(parsed.videoId))
              return true;
            if (parsed.id && playlist.url.includes(parsed.id)) return true;

            return false;
          },
        );

        setActivePlaylistId(matching ? matching.id : null);
      }

      if (customTitle) setTitle(customTitle);
      if (customAuthor) setAuthor(customAuthor);

      if (parsed.platform === "youtube") {
        if (parsed.type === "playlist") {
          mediaTypeRef.current = "playlist";
          targetFirstVideoIdRef.current = parsed.videoId || "";
          setIsLive(false);
          const initialVid = parsed.videoId || "rFZHOHl-L8A";

          setCurrentVideoId(initialVid);
          currentVideoIdRef.current = initialVid;
          setPosterUrl(`https://img.youtube.com/vi/${initialVid}/hqdefault.jpg`);
        } else {
          mediaTypeRef.current = "video";
          targetFirstVideoIdRef.current = "";
          currentVideoIdsRef.current = [];
          setCurrentVideoId(parsed.id);
          currentVideoIdRef.current = parsed.id;
          setPosterUrl(`https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`);
        }
      } else {
        mediaTypeRef.current = "spotify";
        targetFirstVideoIdRef.current = "";
        currentVideoIdsRef.current = [];
      }

      setTracklist([]);
      setCurrentTrackIndex(0);
      currentTrackIndexRef.current = 0;
      setCurrentTime(0);
      currentTimeRef.current = 0;

      if (!isOnlineRef.current) {
        clearBufferingWatchdog();
        pendingActionRef.current = null;
        isPlayingRef.current = false;
        setIsPlaying(false);
        setBuffering(false);

        toast("Playlist Selected 💿", {
          description: `${customTitle || "Playlist"} selected. Will play when reconnected.`,
          variant: "default",
          timeout: 2500,
        });

        return true;
      }

      if (parsed.platform === "youtube") {
        const executeLoad = () => {
          if (!playerRef.current) return;
          lastKnownVideoIdRef.current = "";
          currentVideoIdsRef.current = [];
          setTracklist([]);
          setCurrentTime(0);
          currentTimeRef.current = 0;

          // 1. Force stop any previous playback & queue
          try {
            if (typeof playerRef.current.stopVideo === "function") {
              playerRef.current.stopVideo();
            }
            if (typeof playerRef.current.seekTo === "function") {
              playerRef.current.seekTo(0, true);
            }
          } catch {}

          if (parsed.type === "playlist") {
            mediaTypeRef.current = "playlist";
            targetFirstVideoIdRef.current = parsed.videoId || "";
            setIsLive(false);
            const targetIndex = parsed.index ?? 0;

            if (parsed.videoId) {
              setCurrentVideoId(parsed.videoId);
              currentVideoIdRef.current = parsed.videoId;
              setPosterUrl(
                `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`,
              );
              fetchMetadata(parsed.videoId);
            }

            const playlistOpts: any = {
              list: parsed.id,
              index: targetIndex,
              startSeconds: 0,
              suggestedQuality: "small",
            };

            if (!parsed.id.startsWith("RD") && !parsed.id.startsWith("UL")) {
              playlistOpts.listType = "playlist";
            }

            try {
              if (autoPlay) {
                isPlayingRef.current = true;
                setBuffering(true);
                setIsPlaying(false);
                retryCountRef.current = 0;
                startBufferingWatchdog();

                if (typeof playerRef.current.loadPlaylist === "function") {
                  playerRef.current.loadPlaylist(playlistOpts);
                } else if (
                  typeof playerRef.current.cuePlaylist === "function"
                ) {
                  playerRef.current.cuePlaylist(playlistOpts);
                }
                setTimeout(() => {
                  try {
                    playerRef.current?.unMute?.();
                    playerRef.current?.playVideo?.();
                  } catch {}
                }, 50);
              } else if (typeof playerRef.current.cuePlaylist === "function") {
                clearBufferingWatchdog();
                isPlayingRef.current = false;
                setIsPlaying(false);
                setBuffering(false);
                playerRef.current.cuePlaylist(playlistOpts);
              }
            } catch {}

            let attempts = 0;
            const pollPlaylist = setInterval(() => {
              attempts++;
              if (!playerRef.current || mediaTypeRef.current !== "playlist") {
                clearInterval(pollPlaylist);

                return;
              }

              const list = playerRef.current?.getPlaylist?.();

              if (list && Array.isArray(list) && list.length > 0) {
                const hasTarget = targetFirstVideoIdRef.current
                  ? list.includes(targetFirstVideoIdRef.current)
                  : true;

                if (hasTarget || attempts >= 8) {
                  populatePlaylistTracks(list);
                  const activeIdx =
                    typeof playerRef.current.getPlaylistIndex === "function"
                      ? Math.max(0, playerRef.current.getPlaylistIndex())
                      : targetIndex;

                  setCurrentTrackIndex(activeIdx);
                  syncPlayerTrackMeta();
                  clearInterval(pollPlaylist);
                }
              } else if (attempts > 30) {
                clearInterval(pollPlaylist);
              }
            }, 250);
          } else {
            mediaTypeRef.current = "video";
            targetFirstVideoIdRef.current = "";
            currentVideoIdsRef.current = [];
            setTracklist([]);
            setCurrentTrackIndex(0);
            setCurrentTime(0);
            currentTimeRef.current = 0;
            fetchMetadata(parsed.id);
            if (playerRef.current) {
              try {
                if (autoPlay) {
                  isPlayingRef.current = true;
                  setBuffering(true);
                  setIsPlaying(false);
                  retryCountRef.current = 0;
                  startBufferingWatchdog();
                  if (typeof playerRef.current.loadVideoById === "function") {
                    playerRef.current.loadVideoById({
                      videoId: parsed.id,
                      startSeconds: 0,
                      suggestedQuality: "small",
                    });
                  } else if (
                    typeof playerRef.current.cueVideoById === "function"
                  ) {
                    playerRef.current.cueVideoById({
                      videoId: parsed.id,
                      startSeconds: 0,
                      suggestedQuality: "small",
                    });
                  }
                  setTimeout(() => {
                    try {
                      playerRef.current?.unMute?.();
                      playerRef.current?.playVideo?.();
                    } catch {}
                  }, 50);
                } else if (
                  typeof playerRef.current.cueVideoById === "function"
                ) {
                  clearBufferingWatchdog();
                  isPlayingRef.current = false;
                  setIsPlaying(false);
                  setBuffering(false);
                  playerRef.current.cueVideoById({
                    videoId: parsed.id,
                    startSeconds: 0,
                    suggestedQuality: "small",
                  });
                }
              } catch {}
            }
          }
        };

        if (isPlayerAttached()) {
          executeLoad();
        } else {
          pendingActionRef.current = executeLoad;
        }
      } else {
        clearBufferingWatchdog();
        mediaTypeRef.current = "spotify";
        targetFirstVideoIdRef.current = "";
        currentVideoIdsRef.current = [];
        setTracklist([]);
        setCurrentTime(0);
        currentTimeRef.current = 0;
        if (playerRef.current?.pauseVideo) {
          try {
            playerRef.current.pauseVideo();
          } catch {}
        }
        isPlayingRef.current = autoPlay;
        setIsPlaying(autoPlay);
        setBuffering(false);
      }

      toast("Music Loaded 🎧", {
        description: `Ready: ${customTitle || parsed.platform.toUpperCase()}`,
        variant: "accent",
        timeout: 2000,
      });

      return true;
    },
    [
      isPlayerAttached,
      fetchMetadata,
      populatePlaylistTracks,
      syncPlayerTrackMeta,
      setBuffering,
      setCurrentTime,
      startBufferingWatchdog,
      clearBufferingWatchdog,
    ],
  );

  const playPlaylist = useCallback(
    (playlist: Playlist) => {
      setActivePlaylistId(playlist.id);
      loadUrl(playlist.url, playlist.title, playlist.author, true, playlist.id);
      if (playlist.coverUrl) setPosterUrl(playlist.coverUrl);
      if (playlist.isLive !== undefined) setIsLive(playlist.isLive);
    },
    [loadUrl],
  );

  const addCustomPlaylist = useCallback(
    async (urlStr: string): Promise<boolean> => {
      if (!isOnlineRef.current) {
        toast("Offline Mode", {
          description: "Cannot add custom playlists while offline.",
          variant: "danger",
          timeout: 2500,
        });

        return false;
      }

      const trimmed = urlStr.trim();
      const parsed = parseAudioUrl(trimmed);

      if (!parsed) {
        toast("Invalid Music URL", {
          description: "Please enter a valid Spotify or YouTube link.",
          variant: "danger",
        });

        return false;
      }

      const details = await fetchMediaDetails(trimmed);

      const newPlaylist: Playlist = {
        id: `custom_playlist_${Date.now()}`,
        title:
          details?.title ||
          (parsed.type === "playlist" ? "Custom Playlist" : "Custom Track"),
        author:
          details?.author ||
          (parsed.platform === "spotify" ? "Spotify" : "YouTube"),
        platform: parsed.platform,
        url: trimmed,
        category: "custom",
        isCustom: true,
        coverUrl: details?.coverUrl,
      };

      setCustomPlaylists((prev) => [newPlaylist, ...prev]);

      toast("Added to Collection ✨", {
        description: `"${newPlaylist.title}" added to your collection.`,
        variant: "accent",
        timeout: 2500,
      });

      return true;
    },
    [],
  );

  const removeCustomPlaylist = useCallback((id: string) => {
    setCustomPlaylists((prev) => prev.filter((playlist) => playlist.id !== id));
    toast("Playlist Removed", {
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const renameCustomPlaylist = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();

    if (!trimmed) return;
    setCustomPlaylists((prev) =>
      prev.map((playlist) => (playlist.id === id ? { ...playlist, title: trimmed } : playlist)),
    );
    toast("Playlist Renamed", {
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const moveCustomPlaylist = useCallback(
    (id: string, direction: "up" | "down") => {
      setCustomPlaylists((prev) => {
        const index = prev.findIndex((playlist) => playlist.id === id);

        if (index === -1) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const [moved] = next.splice(index, 1);

        next.splice(targetIndex, 0, moved);

        return next;
      });
    },
    [],
  );

  const reorderCustomPlaylists = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;
      setCustomPlaylists((prev) => {
        const oldIndex = prev.findIndex((playlist) => playlist.id === activeId);
        const newIndex = prev.findIndex((playlist) => playlist.id === overId);

        if (oldIndex === -1 || newIndex === -1) return prev;

        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);

        next.splice(newIndex, 0, moved);

        return next;
      });
    },
    [],
  );

  const toggleDeck = useCallback(() => setIsDeckOpen((prev) => !prev), []);
  const togglePicker = useCallback(() => setIsPickerOpen((prev) => !prev), []);
  const togglePosterPreview = useCallback(
    () => setIsPosterHidden((prev) => !prev),
    [],
  );

  const value = useMemo(
    () => ({
      activeUrl,
      activePlatform,
      title,
      author,
      posterUrl,
      isLive,
      isPlaying,
      isBuffering,
      isOnline,
      volume,
      currentTime,
      duration,
      activePlaylistId,
      tracklist,
      currentTrackIndex,
      customPlaylists,
      isDeckOpen,
      isPickerOpen,
      isReady,
      isPosterHidden,
      spotifyEmbedUrl,
      currentPlayingUrl,
      playerKey,
      setIsDeckOpen,
      setIsPickerOpen,
      toggleDeck,
      togglePicker,
      togglePosterPreview,
      retryPlayer,
      play,
      pause,
      togglePlay,
      seekTo,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
      playTrackAt,
      loadUrl,
      playPlaylist,
      addCustomPlaylist,
      removeCustomPlaylist,
      renameCustomPlaylist,
      moveCustomPlaylist,
      reorderCustomPlaylists,
      bindYTPlayerElement,
    }),
    [
      activeUrl,
      activePlatform,
      title,
      author,
      posterUrl,
      isLive,
      isPlaying,
      isBuffering,
      isOnline,
      volume,
      currentTime,
      duration,
      activePlaylistId,
      tracklist,
      currentTrackIndex,
      customPlaylists,
      isDeckOpen,
      isPickerOpen,
      isReady,
      isPosterHidden,
      spotifyEmbedUrl,
      currentPlayingUrl,
      playerKey,
      setIsDeckOpen,
      setIsPickerOpen,
      toggleDeck,
      togglePicker,
      togglePosterPreview,
      retryPlayer,
      play,
      pause,
      togglePlay,
      seekTo,
      setVolume,
      toggleMute,
      nextTrack,
      prevTrack,
      playTrackAt,
      loadUrl,
      playPlaylist,
      addCustomPlaylist,
      removeCustomPlaylist,
      renameCustomPlaylist,
      moveCustomPlaylist,
      reorderCustomPlaylists,
      bindYTPlayerElement,
    ],
  );

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);

  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }

  return ctx;
}
