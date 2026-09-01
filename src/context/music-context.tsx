import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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

export interface SavedMusicState {
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
}

export interface MusicContextValue {
  activeUrl: string;
  activePlatform: MusicPlatform;
  title: string;
  author: string;
  posterUrl: string;
  isLive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
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

  setIsDeckOpen: (open: boolean) => void;
  setIsPickerOpen: (open: boolean) => void;
  toggleDeck: () => void;
  togglePicker: () => void;
  togglePosterPreview: () => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number, shouldContinuePlaying?: boolean) => void;
  setVolume: (vol: number) => void;

  nextTrack: () => void;
  prevTrack: () => void;
  playTrackAt: (index: number) => void;

  loadUrl: (
    url: string,
    title?: string,
    author?: string,
    autoPlay?: boolean,
  ) => boolean;
  playPlaylist: (playlist: Playlist) => void;

  addCustomPlaylist: (url: string) => Promise<boolean>;
  removeCustomPlaylist: (id: string) => void;
  renameCustomPlaylist: (id: string, newTitle: string) => void;
  moveCustomPlaylist: (id: string, direction: "up" | "down") => void;

  bindYTPlayerElement: (el: HTMLDivElement | null) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  // Synchronously hydrate initial saved state
  const initialSaved = useMemo(() => {
    return storageAdapter.getItem<SavedMusicState | null>(
      MUSIC_STORAGE_KEY,
      null,
    );
  }, []);

  const [activeUrl, setActiveUrl] = useState<string>(
    () => initialSaved?.activeUrl || PRESET_PLAYLISTS[0].url,
  );
  const [activePlatform, setActivePlatform] = useState<MusicPlatform>(
    () => initialSaved?.activePlatform || "youtube",
  );
  const [title, setTitle] = useState<string>(
    () => initialSaved?.title || PRESET_PLAYLISTS[0].title,
  );
  const [author, setAuthor] = useState<string>(
    () => initialSaved?.author || PRESET_PLAYLISTS[0].author,
  );
  const [posterUrl, setPosterUrl] = useState<string>(
    () =>
      initialSaved?.posterUrl ||
      PRESET_PLAYLISTS[0].coverUrl ||
      "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
  );
  const [isLive, setIsLive] = useState<boolean>(
    () => initialSaved?.isLive ?? true,
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(
    () => initialSaved?.volume ?? 80,
  );
  const [currentTime, setCurrentTime] = useState<number>(
    () => initialSaved?.currentTime || 0,
  );
  const [duration, setDuration] = useState<number>(0);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    () => initialSaved?.activePlaylistId || PRESET_PLAYLISTS[0].id,
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
      : parsed?.videoId || "jfKfPfyJRdk";
  });
  const [isPosterHidden, setIsPosterHidden] = useState<boolean>(false);

  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => {
    return storageAdapter.getItem<Playlist[]>(CUSTOM_PLAYLISTS_STORAGE_KEY, []);
  });

  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const isReadyRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const progressTimerRef = useRef<any>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const lastKnownVideoIdRef = useRef<string>("");
  const currentLoadedPlaylistIdRef = useRef<string>("");
  const currentVideoIdsRef = useRef<string[]>([]);
  const autoPlayPendingRef = useRef<boolean>(false);
  const trackMetaCacheRef = useRef<
    Map<string, { title: string; author: string }>
  >(new Map());

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

  // Derive Spotify Embed URL
  const spotifyEmbedUrl = useMemo(() => {
    if (activePlatform !== "spotify") return null;
    const parsed = parseAudioUrl(activeUrl);

    if (parsed && parsed.platform === "spotify") {
      return `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
    }

    return null;
  }, [activePlatform, activeUrl]);

  // Dynamically compute the exact link of the currently playing track/song
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

  // Check if player is attached to active DOM without stale closures
  const isPlayerAttached = useCallback(() => {
    if (!playerRef.current || !isReadyRef.current) {
      return false;
    }
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

  // Multi-tier metadata resolution (YouTube OEMBED -> NoEmbed -> getVideoData)
  const fetchMetadata = useCallback(async (videoId: string) => {
    if (!videoId) return;
    lastKnownVideoIdRef.current = videoId;
    setCurrentVideoId(videoId);
    setPosterUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);

    // Tier 1: YouTube OEMBED
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
    } catch {
      // fallback to tier 2
    }

    // Tier 2: NoEmbed
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      );
      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.author_name) setAuthor(data.author_name);
    } catch {
      // fallback to tier 3
    }
  }, []);

  const syncPlayerTrackMeta = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const data =
        typeof playerRef.current.getVideoData === "function"
          ? playerRef.current.getVideoData()
          : null;
      const currentVidId = data ? data.video_id : "";

      if (currentVidId && currentVidId !== lastKnownVideoIdRef.current) {
        lastKnownVideoIdRef.current = currentVidId;
        setCurrentVideoId(currentVidId);
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

        if (typeof playerRef.current.getPlaylistIndex === "function") {
          const idx = playerRef.current.getPlaylistIndex();

          if (idx !== -1) {
            setCurrentTrackIndex(idx);
            if (data?.title) {
              setTracklist((prev) =>
                prev.map((t, i) =>
                  i === idx
                    ? {
                        ...t,
                        title: data.title || t.title,
                        author:
                          data.author &&
                          !data.author.toLowerCase().includes("playlist")
                            ? data.author
                            : t.author,
                      }
                    : t,
                ),
              );
            }
          }
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
      if (typeof playerRef.current.getCurrentTime === "function") {
        const cur = playerRef.current.getCurrentTime() || 0;

        setCurrentTime(cur);
      }
    } catch {
      // ignore
    }
  }, [fetchMetadata]);

  // Timeline scrubber loop & Live Stream Detection
  const startTimeline = useCallback(() => {
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      if (!playerRef.current || !isReadyRef.current) return;
      try {
        if (typeof playerRef.current.getCurrentTime !== "function") return;
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur =
          typeof playerRef.current.getDuration === "function"
            ? playerRef.current.getDuration() || 0
            : 0;
        const vData =
          typeof playerRef.current.getVideoData === "function"
            ? playerRef.current.getVideoData()
            : {};

        const live = vData?.isLive === true || (dur > 43200 && isFinite(dur));

        setIsLive(live);
        setCurrentTime(cur);
        if (dur > 0) {
          setDuration(dur);
        }
      } catch {
        // ignore
      }
    }, 250);
  }, []);

  const fetchSingleTrackMeta = useCallback(
    async (
      vidId: string,
      maxRetries: number = 3,
    ): Promise<{ title?: string; author?: string }> => {
      if (trackMetaCacheRef.current.has(vidId)) {
        return trackMetaCacheRef.current.get(vidId)!;
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Tier 1: YouTube OEMBED
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

        // Tier 2: NoEmbed
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

        // Progressive delay before retry
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, (attempt + 1) * 350),
          );
        }
      }

      return {};
    },
    [],
  );

  const populatePlaylistTracks = useCallback(
    (videoIds: string[]) => {
      if (!videoIds || videoIds.length === 0) {
        return;
      }

      if (
        currentVideoIdsRef.current.length === videoIds.length &&
        currentVideoIdsRef.current.every((id, i) => id === videoIds[i])
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

      // Staggered batching: process chunks of 4 to respect API rate limits
      const batchSize = 4;
      let currentOffset = 0;

      const processBatches = async () => {
        while (currentOffset < videoIds.length) {
          const chunk = videoIds.slice(
            currentOffset,
            currentOffset + batchSize,
          );
          const startIdx = currentOffset;

          currentOffset += batchSize;

          const results = await Promise.all(
            chunk.map((vidId) => fetchSingleTrackMeta(vidId)),
          );

          setTracklist((prev) =>
            prev.map((t, i) => {
              const relIdx = i - startIdx;

              if (relIdx >= 0 && relIdx < results.length) {
                const meta = results[relIdx];

                if (meta?.title) {
                  return {
                    ...t,
                    title: meta.title,
                    author: meta.author || "",
                  };
                }
              }

              return t;
            }),
          );

          if (currentOffset < videoIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
        }
      };

      processBatches();
    },
    [fetchSingleTrackMeta],
  );

  // Initialize YouTube Engine safely
  const initYTPlayer = useCallback(() => {
    if (!ytContainerRef.current || playerRef.current) return;

    const createPlayer = () => {
      if (!ytContainerRef.current || playerRef.current || !window.YT?.Player)
        return;

      const ytData = parseYouTubeUrl(activeUrl);
      const initialVid =
        ytData?.type === "video" ? ytData.id : ytData?.videoId || "jfKfPfyJRdk";

      try {
        playerRef.current = new window.YT.Player(ytContainerRef.current, {
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
          },
          events: {
            onReady: (event: any) => {
              isReadyRef.current = true;
              setIsReady(true);
              try {
                event.target.setVolume(volume);
                if (event.target.setPlaybackQuality) {
                  event.target.setPlaybackQuality("small");
                }
              } catch {}

              startTimeline();

              // Execute pending command if any
              if (pendingActionRef.current) {
                const action = pendingActionRef.current;

                pendingActionRef.current = null;
                action();
              } else if (ytData?.type === "playlist") {
                currentLoadedPlaylistIdRef.current = ytData.id;
                const isMix =
                  ytData.id.startsWith("RD") || ytData.id.startsWith("UL");
                const targetIdx =
                  initialSaved?.currentTrackIndex ?? ytData.index ?? 0;
                const cueOpts: any = {
                  list: ytData.id,
                  index: targetIdx,
                  suggestedQuality: "small",
                };

                if (!isMix) {
                  cueOpts.listType = "playlist";
                }

                try {
                  event.target.cuePlaylist(cueOpts);
                  if (
                    initialSaved?.currentTime &&
                    initialSaved.currentTime > 0 &&
                    !initialSaved.isLive
                  ) {
                    setTimeout(() => {
                      try {
                        event.target.seekTo(initialSaved.currentTime, false);
                      } catch {}
                    }, 400);
                  }
                } catch {}

                // Poll playlist safely without destroying it on timeout
                let attempts = 0;
                const pollPlaylist = setInterval(() => {
                  attempts++;
                  const list = event.target?.getPlaylist?.();

                  if (list && Array.isArray(list) && list.length > 0) {
                    populatePlaylistTracks(list);
                    clearInterval(pollPlaylist);
                  } else if (attempts > 20) {
                    clearInterval(pollPlaylist);
                  }
                }, 300);
              } else if (initialVid) {
                fetchMetadata(initialVid);
                if (
                  initialSaved?.currentTime &&
                  initialSaved.currentTime > 0 &&
                  !initialSaved.isLive
                ) {
                  setTimeout(() => {
                    try {
                      event.target.seekTo(initialSaved.currentTime, true);
                    } catch {}
                  }, 200);
                }
              }
            },
            onStateChange: (event: any) => {
              syncPlayerTrackMeta();

              const list = event.target?.getPlaylist?.();

              if (list && Array.isArray(list) && list.length > 0) {
                populatePlaylistTracks(list);
              }

              if (event.data === window.YT.PlayerState.PLAYING) {
                autoPlayPendingRef.current = false;
                isPlayingRef.current = true;
                setIsPlaying(true);
                setIsBuffering(false);
                retryCountRef.current = 0;
                startTimeline();
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                autoPlayPendingRef.current = false;
                isPlayingRef.current = false;
                setIsPlaying(false);
                setIsBuffering(false);
                if (playerRef.current?.getCurrentTime) {
                  try {
                    setCurrentTime(playerRef.current.getCurrentTime() || 0);
                  } catch {}
                }
              } else if (event.data === window.YT.PlayerState.ENDED) {
                autoPlayPendingRef.current = false;
                isPlayingRef.current = false;
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (event.data === window.YT.PlayerState.CUED) {
                if (autoPlayPendingRef.current) {
                  autoPlayPendingRef.current = false;
                  try {
                    event.target.playVideo();
                  } catch {}
                } else {
                  isPlayingRef.current = false;
                  setIsPlaying(false);
                  setIsBuffering(false);
                }
              } else {
                setIsBuffering(false);
              }
            },
            onError: () => {
              setIsBuffering(true);
              clearTimeout(retryTimeoutRef.current);
              if (retryCountRef.current < 5) {
                retryCountRef.current += 1;
                const delay = Math.min(3000, retryCountRef.current * 750);

                retryTimeoutRef.current = setTimeout(() => {
                  if (playerRef.current && isReadyRef.current) {
                    try {
                      if (typeof playerRef.current.playVideo === "function") {
                        playerRef.current.playVideo();
                      }
                    } catch {}
                  }
                }, delay);
              } else {
                setIsPlaying(false);
                setIsBuffering(false);
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
      const existingScript = document.getElementById("yt-iframe-api");

      if (!existingScript) {
        const tag = document.createElement("script");

        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }

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
    }
  }, [
    activeUrl,
    volume,
    fetchMetadata,
    syncPlayerTrackMeta,
    startTimeline,
    initialSaved,
    populatePlaylistTracks,
  ]);

  const bindYTPlayerElement = useCallback(
    (el: HTMLDivElement | null) => {
      ytContainerRef.current = el;
      if (el && !playerRef.current) {
        initYTPlayer();
      }
    },
    [initYTPlayer],
  );

  const play = useCallback(() => {
    if (activePlatform === "youtube") {
      setIsBuffering(true);

      const executePlay = () => {
        if (!playerRef.current) return;
        try {
          const targetTime = currentTime > 0 && !isLive ? currentTime : 0;

          // Force seekTo with allowSeekAhead = true to immediately unblock browser buffering
          if (
            typeof playerRef.current.seekTo === "function" &&
            targetTime > 0
          ) {
            playerRef.current.seekTo(targetTime, true);
          }

          if (typeof playerRef.current.playVideo === "function") {
            playerRef.current.playVideo();
          }

          // If the player was in CUED (5) or UNSTARTED (-1), kickstart stream decoding safely
          setTimeout(() => {
            if (!playerRef.current) return;
            try {
              const state =
                typeof playerRef.current.getPlayerState === "function"
                  ? playerRef.current.getPlayerState()
                  : -1;

              if (state === 5 || state === -1) {
                const parsed = parseYouTubeUrl(activeUrl);

                if (parsed?.type === "playlist") {
                  if (typeof playerRef.current.playVideoAt === "function") {
                    playerRef.current.playVideoAt(currentTrackIndex || 0);
                  } else if (
                    typeof playerRef.current.playVideo === "function"
                  ) {
                    playerRef.current.playVideo();
                  }
                } else {
                  const vidId =
                    currentVideoId ||
                    (parsed?.type === "video" ? parsed.id : parsed?.videoId);

                  if (
                    vidId &&
                    typeof playerRef.current.loadVideoById === "function"
                  ) {
                    playerRef.current.loadVideoById({
                      videoId: vidId,
                      startSeconds: targetTime,
                      suggestedQuality: "small",
                    });
                  }
                }
              }
            } catch {}
          }, 350);
        } catch {}
      };

      if (isPlayerAttached() && isReadyRef.current) {
        executePlay();
      } else {
        pendingActionRef.current = executePlay;
      }
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsBuffering(false);
    }
  }, [
    activePlatform,
    isPlayerAttached,
    currentTime,
    isLive,
    currentVideoId,
    activeUrl,
    currentTrackIndex,
  ]);

  const pause = useCallback(() => {
    pendingActionRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
    clearTimeout(retryTimeoutRef.current);
    if (
      activePlatform === "youtube" &&
      isPlayerAttached() &&
      playerRef.current?.pauseVideo
    ) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    }
  }, [activePlatform, isPlayerAttached]);

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

      setVolumeState(clamped);
      if (isPlayerAttached() && playerRef.current?.setVolume) {
        try {
          playerRef.current.setVolume(clamped);
        } catch {}
      }
    },
    [isPlayerAttached],
  );

  const nextTrack = useCallback(() => {
    if (tracklist.length <= 1) return;
    if (isPlayerAttached() && playerRef.current?.nextVideo) {
      try {
        playerRef.current.nextVideo();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {}
    }
  }, [isPlayerAttached, tracklist.length]);

  const prevTrack = useCallback(() => {
    if (tracklist.length <= 1) return;
    if (isPlayerAttached() && playerRef.current?.previousVideo) {
      try {
        playerRef.current.previousVideo();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {}
    }
  }, [isPlayerAttached, tracklist.length]);

  const playTrackAt = useCallback(
    (index: number) => {
      if (isPlayerAttached() && playerRef.current?.playVideoAt) {
        try {
          playerRef.current.playVideoAt(index);
          setCurrentTrackIndex(index);
          isPlayingRef.current = true;
          setIsPlaying(true);
        } catch {}
      }
    },
    [isPlayerAttached],
  );

  const loadUrl = useCallback(
    (
      url: string,
      customTitle?: string,
      customAuthor?: string,
      autoPlay: boolean = false,
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
      setActivePlatform(parsed.platform);
      if (customTitle) setTitle(customTitle);
      if (customAuthor) setAuthor(customAuthor);

      if (parsed.platform === "youtube") {
        const executeLoad = () => {
          if (!playerRef.current) return;
          lastKnownVideoIdRef.current = "";
          currentVideoIdsRef.current = [];

          if (parsed.type === "playlist") {
            setIsLive(false);
            const targetIndex = parsed.index ?? 0;

            if (parsed.videoId) {
              setCurrentVideoId(parsed.videoId);
            }

            if (currentLoadedPlaylistIdRef.current === parsed.id) {
              try {
                if (
                  autoPlay &&
                  typeof playerRef.current.playVideoAt === "function"
                ) {
                  playerRef.current.playVideoAt(targetIndex);
                  isPlayingRef.current = true;
                  setIsPlaying(true);
                }
                setTimeout(syncPlayerTrackMeta, 300);
              } catch {}
            } else {
              currentLoadedPlaylistIdRef.current = parsed.id;
              const isMix =
                parsed.id.startsWith("RD") || parsed.id.startsWith("UL");
              const cueOpts: any = {
                list: parsed.id,
                index: targetIndex,
                suggestedQuality: "small",
              };

              if (!isMix) {
                cueOpts.listType = "playlist";
              }

              try {
                if (autoPlay) {
                  autoPlayPendingRef.current = true;
                  isPlayingRef.current = true;
                  setIsPlaying(true);

                  if (
                    parsed.videoId &&
                    typeof playerRef.current.loadVideoById === "function"
                  ) {
                    playerRef.current.loadVideoById({
                      videoId: parsed.videoId,
                      suggestedQuality: "small",
                    });
                    if (typeof playerRef.current.cuePlaylist === "function") {
                      setTimeout(() => {
                        try {
                          playerRef.current?.cuePlaylist?.(cueOpts);
                        } catch {}
                      }, 400);
                    }
                  } else if (
                    typeof playerRef.current.loadPlaylist === "function"
                  ) {
                    playerRef.current.loadPlaylist(cueOpts);
                  } else if (
                    typeof playerRef.current.cuePlaylist === "function"
                  ) {
                    playerRef.current.cuePlaylist(cueOpts);
                    playerRef.current.playVideo?.();
                  }
                } else if (
                  typeof playerRef.current.cuePlaylist === "function"
                ) {
                  autoPlayPendingRef.current = false;
                  playerRef.current.cuePlaylist(cueOpts);
                }
              } catch {}

              let attempts = 0;
              const pollPlaylist = setInterval(() => {
                attempts++;
                const list = playerRef.current?.getPlaylist?.();

                if (list && Array.isArray(list) && list.length > 0) {
                  populatePlaylistTracks(list);
                  const activeIdx =
                    typeof playerRef.current.getPlaylistIndex === "function"
                      ? Math.max(0, playerRef.current.getPlaylistIndex())
                      : targetIndex;

                  setCurrentTrackIndex(activeIdx);
                  clearInterval(pollPlaylist);
                } else if (attempts > 25) {
                  clearInterval(pollPlaylist);
                }
              }, 250);
            }
          } else {
            currentLoadedPlaylistIdRef.current = "";
            currentVideoIdsRef.current = [];
            setTracklist([]);
            fetchMetadata(parsed.id);
            if (playerRef.current) {
              try {
                if (typeof playerRef.current.loadVideoById === "function") {
                  playerRef.current.loadVideoById({
                    videoId: parsed.id,
                    suggestedQuality: "small",
                  });
                } else if (
                  typeof playerRef.current.cueVideoById === "function"
                ) {
                  playerRef.current.cueVideoById({
                    videoId: parsed.id,
                    suggestedQuality: "small",
                  });
                  playerRef.current.playVideo?.();
                }
                isPlayingRef.current = true;
                setIsPlaying(true);
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
        currentLoadedPlaylistIdRef.current = "";
        currentVideoIdsRef.current = [];
        setTracklist([]);
        if (playerRef.current?.pauseVideo) {
          try {
            playerRef.current.pauseVideo();
          } catch {}
        }
        setIsPlaying(false);
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
    ],
  );

  const playPlaylist = useCallback(
    (playlist: Playlist) => {
      setActivePlaylistId(playlist.id);
      loadUrl(playlist.url, playlist.title, playlist.author, true);
      if (playlist.coverUrl) setPosterUrl(playlist.coverUrl);
      if (playlist.isLive !== undefined) setIsLive(playlist.isLive);
    },
    [loadUrl],
  );

  const addCustomPlaylist = useCallback(
    async (urlStr: string): Promise<boolean> => {
      const trimmed = urlStr.trim();
      const parsed = parseAudioUrl(trimmed);

      if (!parsed) {
        toast("Invalid Music URL", {
          description: "Please enter a valid Spotify or YouTube link.",
          variant: "danger",
        });

        return false;
      }

      // Automatically fetch title, artist name, and album/video artwork
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
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== id));
    toast("Playlist Removed", {
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const renameCustomPlaylist = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();

    if (!trimmed) return;
    setCustomPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: trimmed } : p)),
    );
    toast("Playlist Renamed", {
      variant: "default",
      timeout: 2000,
    });
  }, []);

  const moveCustomPlaylist = useCallback(
    (id: string, direction: "up" | "down") => {
      setCustomPlaylists((prev) => {
        const index = prev.findIndex((p) => p.id === id);

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

      setIsDeckOpen,
      setIsPickerOpen,
      toggleDeck,
      togglePicker,
      togglePosterPreview,

      play,
      pause,
      togglePlay,
      seekTo,
      setVolume,

      nextTrack,
      prevTrack,
      playTrackAt,

      loadUrl,
      playPlaylist,

      addCustomPlaylist,
      removeCustomPlaylist,
      renameCustomPlaylist,
      moveCustomPlaylist,

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
      setIsDeckOpen,
      setIsPickerOpen,
      toggleDeck,
      togglePicker,
      togglePosterPreview,
      play,
      pause,
      togglePlay,
      seekTo,
      setVolume,
      nextTrack,
      prevTrack,
      playTrackAt,
      loadUrl,
      playPlaylist,
      addCustomPlaylist,
      removeCustomPlaylist,
      renameCustomPlaylist,
      moveCustomPlaylist,
      bindYTPlayerElement,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      {/* Permanent Global Hidden YouTube Player Host - Never Unmounts across tab navigation */}
      <div
        aria-hidden="true"
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-1]"
        id="cozify-yt-host"
      >
        <div
          ref={bindYTPlayerElement}
          className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-none"
          id="cozify-yt-player-element"
        />
      </div>
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);

  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }

  return ctx;
}
