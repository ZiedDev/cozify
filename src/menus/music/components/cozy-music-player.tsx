import {
  useState,
  useEffect,
  useRef,
  useMemo,
  SyntheticEvent,
  SubmitEvent,
} from "react";
import {
  Button,
  Typography,
  TextField,
  InputGroup,
  ScrollShadow,
  Slider,
  Spinner,
} from "@heroui/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  Disc3,
  Loader2,
  WifiOff,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { MarqueeTitle } from "@/components/music";
import { useMusic } from "@/context/music-context";
import { formatTime } from "@/config/playlists";

export function CozyMusicCard() {
  const {
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
    tracklist,
    isPosterHidden,
    currentTrackIndex,
    currentPlayingUrl,
    spotifyEmbedUrl,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    playTrackAt,
    loadUrl,
    togglePicker,
    togglePosterPreview,
    bindYTPlayerElement,
    playerKey,
  } = useMusic();

  const [inputUrl, setInputUrl] = useState("");
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  const discRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<number>(0);
  const velocityRef = useRef<{ speed: number }>({ speed: 0 });
  const speedTweenRef = useRef<gsap.core.Tween | null>(null);

  // Dynamic aspect-ratio calculation for 1:1 media box fill & complete YouTube UI cloaking
  const cropStyle = useMemo(() => {
    if (videoAspectRatio >= 1) {
      // Landscape video (16:9, 4:3, 21:9)
      const baseHeight = 190;
      const baseWidth = Math.round(
        Math.max(120, baseHeight * (videoAspectRatio / 1.778) * 1.32),
      );

      return {
        width: `${baseWidth}%`,
        height: `${baseHeight}%`,
      };
    } else {
      // Portrait / Shorts video (9:16)
      const baseWidth = 190;
      const baseHeight = Math.round(
        Math.max(120, baseWidth * (1.778 / videoAspectRatio)),
      );

      return {
        width: `${baseWidth}%`,
        height: `${baseHeight}%`,
      };
    }
  }, [videoAspectRatio]);

  const handlePosterLoad = (
    loadEvent: SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = loadEvent.currentTarget;

    if (img.naturalWidth && img.naturalHeight) {
      setVideoAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  const scrubberPercentage =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  // Physics-based Vinyl turntable animation via GSAP ticker with GPU force3D
  useGSAP(
    () => {
      let isAttached = false;
      const tickerCallback = (_time: number, deltaTime: number) => {
        if (!discRef.current) return;
        const dt = Math.min(deltaTime / 1000, 0.05);

        if (velocityRef.current.speed > 0.0001) {
          rotationRef.current -= velocityRef.current.speed * 45 * dt;
          if (rotationRef.current < 0) {
            rotationRef.current = (rotationRef.current % 360) + 360;
          }
          gsap.set(discRef.current, {
            rotation: rotationRef.current,
            force3D: true,
          });
        } else if (!isPlaying && isAttached) {
          gsap.ticker.remove(tickerCallback);
          isAttached = false;
        }
      };

      if (speedTweenRef.current) speedTweenRef.current.kill();

      if (isPlaying && !isBuffering) {
        if (!isAttached) {
          gsap.ticker.add(tickerCallback);
          isAttached = true;
        }
        speedTweenRef.current = gsap.to(velocityRef.current, {
          speed: 1,
          duration: 1.8,
          ease: "power2.out",
        });
      } else {
        speedTweenRef.current = gsap.to(velocityRef.current, {
          speed: 0,
          duration: 2.4,
          ease: "power3.out",
          onComplete: () => {
            if (isAttached) {
              gsap.ticker.remove(tickerCallback);
              isAttached = false;
            }
          },
        });
      }

      return () => {
        if (isAttached) {
          gsap.ticker.remove(tickerCallback);
        }
      };
    },
    { dependencies: [isPlaying, isBuffering] },
  );

  // Subtle title & artist reveal on track change
  useGSAP(
    () => {
      if (metaRef.current) {
        gsap.fromTo(
          metaRef.current,
          { opacity: 0, y: 5 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        );
      }
    },
    { dependencies: [title, author], scope: metaRef },
  );

  // Auto-close tracklist if tracklist becomes empty
  useEffect(() => {
    if (tracklist.length <= 1 && isTracklistOpen) {
      setIsTracklistOpen(false);
    }
  }, [tracklist.length, isTracklistOpen]);

  const handleLoad = (event?: SubmitEvent) => {
    if (event) event.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim(), undefined, undefined, true);

    if (success) setInputUrl("");
  };

  const hasMultipleTracks = tracklist.length > 1;
  const isSpotify = activePlatform === "spotify";

  return (
    <div className="cozy-music-wrapper w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto flex flex-col items-center gap-2 sm:gap-2.5 md:gap-3 select-none relative">
      {/* Top Header: Platform Indicator, Status, Actions */}
      <div className="w-full flex items-center justify-between pb-0.5 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`size-2.5 rounded-full shrink-0 transition-colors duration-300 ${
              !isOnline
                ? "bg-danger"
                : isBuffering
                  ? "bg-amber-400 animate-ping"
                  : isPlaying
                    ? "bg-accent"
                    : "bg-muted/50"
            }`}
          />
          <Typography
            truncate
            className="text-xs font-bold uppercase text-foreground"
            type="body-xs"
          >
            {!isOnline
              ? "Offline"
              : isBuffering
                ? "Loading..."
                : isPlaying
                  ? "Now Playing"
                  : "Paused"}
          </Typography>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dynamic Clickable Platform Badge with 'Open in' */}
          <a
            className={`inline-flex items-center gap-1.5 h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-full text-xs font-semibold border transition-colors duration-150 ${
              isSpotify
                ? "text-[#1db954] bg-[#1db954]/10 border-[#1db954]/25 hover:bg-[#1db954]/20"
                : "text-[#ff4e4e] bg-[#ff0000]/10 border-[#ff0000]/25 hover:bg-[#ff0000]/20"
            }`}
            href={currentPlayingUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {isSpotify ? (
              <svg
                className="size-4 sm:size-4.5 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.306c-.215.352-.676.463-1.028.247-2.816-1.72-6.36-2.109-10.536-1.155-.403.093-.804-.158-.897-.562-.093-.403.158-.804.562-.897 4.571-1.045 8.492-.596 11.652 1.339.352.216.463.676.247 1.028zm1.467-3.262c-.27.44-.848.578-1.288.308-3.224-1.982-8.14-2.557-11.954-1.399-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.364-1.324 9.791-.682 13.48 1.589.44.27.578.848.308 1.288zm.126-3.41c-3.867-2.296-10.248-2.508-13.941-1.387-.593.18-1.22-.164-1.4-.757-.18-.593.164-1.22.757-1.4 4.248-1.29 11.294-1.037 15.741 1.603.533.316.707 1.01.391 1.543-.316.533-1.01.707-1.543.391z" />
              </svg>
            ) : (
              <svg
                className="size-4 sm:size-4.5 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              Open in {isSpotify ? "Spotify" : "YouTube"}
            </span>
          </a>

          {/* Button with Playlists text */}
          <Button
            className="h-7.5 sm:h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 text-foreground hover:bg-surface-secondary border border-separator/60 hover:border-separator/90 bg-surface cursor-pointer transition-colors duration-150 shadow-xs"
            size="sm"
            variant="secondary"
            onClick={togglePicker}
          >
            <Disc3 className="size-4.5 text-accent shrink-0" />
            <span>Playlists</span>
          </Button>
        </div>
      </div>

      {/* Spotify Mode: Only the Spotify Player in the middle without fancy controls */}
      {isSpotify && spotifyEmbedUrl ? (
        <div className="w-full h-72 sm:h-80 md:h-84 rounded-2xl overflow-hidden border border-separator/40 bg-surface-secondary/60 shadow-xl my-0.5">
          <iframe
            key={`spotify-${playerKey}`}
            allow="encrypted-media; fullscreen; picture-in-picture"
            className="w-full h-full border-none block"
            src={spotifyEmbedUrl}
            title="Spotify Audio Player"
          />
        </div>
      ) : (
        /* YouTube / Default Mode: Full Cozy Spinning Vinyl & Tactical Controls */
        <>
          {/* Dynamic Media Box: Large Vinyl Record (Round) <-> 1:1 Square Video Playback */}
          <button
            aria-label={
              isPosterHidden ? "Switch to vinyl mode" : "Switch to video mode"
            }
            className={`relative size-36 sm:size-44 md:size-48 lg:size-52 my-0.5 sm:my-1 overflow-hidden ring-2 ring-white/15 transition-[border-radius,box-shadow,transform,scale] duration-400 ease-in-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none text-left p-0 border-none outline-none focus-visible:ring-2 focus-visible:ring-accent group shrink-0 ${
              isPosterHidden
                ? "bg-black shadow-2xl"
                : "bg-transparent shadow-xl"
            }`}
            style={{
              borderRadius: isPosterHidden ? "1.25rem" : "50%",
            }}
            title={
              isPosterHidden
                ? "Click to switch to Vinyl"
                : "Click to watch Video"
            }
            type="button"
            onClick={togglePosterPreview}
          >
            {/* 1. Square Center-Cropped Native YouTube Video Layer with Zoom Crop */}
            <div
              className={`video-crop-wrapper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-[opacity,transform] duration-400 ease-in-out [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-none [&_div]:w-full [&_div]:h-full ${
                isPosterHidden
                  ? "scale-100 opacity-100 pointer-events-auto"
                  : "scale-95 opacity-0 pointer-events-none"
              }`}
              style={cropStyle}
            >
              <div
                key={playerKey}
                ref={bindYTPlayerElement}
                className="w-full h-full"
              />
            </div>

            {/* 2. Round Vinyl Disc Layer with Clean Scale, Blur & Brightness Transition */}
            <div
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-[opacity,transform,filter] duration-400 ease-in-out ${
                isPosterHidden
                  ? "opacity-0 scale-110 blur-sm brightness-110 pointer-events-none"
                  : "opacity-100 scale-100 blur-0 brightness-100 pointer-events-auto"
              }`}
            >
              {/* Vinyl Grooves & Image with GSAP Controlled Velocity Spin & Transparent Center Hole Mask */}
              <div
                ref={discRef}
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative shadow-inner will-change-transform transform-[translateZ(0)]"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle at center, transparent 14px, black 15px)",
                  maskImage:
                    "radial-gradient(circle at center, transparent 14px, black 15px)",
                }}
              >
                {/* Embedded Full Poster Artwork filling the disc grooves */}
                <img
                  alt={title || "Now Playing"}
                  className="w-full h-full object-cover select-none pointer-events-none brightness-95 contrast-105"
                  src={
                    posterUrl ||
                    "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg"
                  }
                  onLoad={handlePosterLoad}
                />

                {/* Concentric Vinyl Texture & Grooves */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.4)_40%,transparent_60%,rgba(0,0,0,0.5)_80%,transparent_100%)] pointer-events-none" />

                {/* Subtle turntable light reflection shimmer */}
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.15)_0deg,transparent_60deg,rgba(255,255,255,0.1)_180deg,transparent_240deg,rgba(255,255,255,0.15)_360deg)] pointer-events-none mix-blend-overlay" />
              </div>

              {/* Central Spindle Hole with metallic rim and 100% transparent cutout or loading spinner */}
              <div className="absolute size-8 rounded-full border-2 border-white/40 shadow-inner flex items-center justify-center bg-black/40 backdrop-blur-xs transition-[transform,opacity] pointer-events-none">
                {!isOnline ? (
                  <WifiOff className="size-3.5 text-danger" />
                ) : isBuffering ? (
                  <Spinner color="accent" size="sm" />
                ) : (
                  <div className="size-3.5 rounded-full border border-white/25 bg-transparent" />
                )}
              </div>
            </div>
          </button>

          {/* Track Info (Title & Artist) */}
          <div
            ref={metaRef}
            className="w-full flex flex-col items-center text-center min-w-0 px-3 overflow-hidden"
          >
            <MarqueeTitle
              align="center"
              className="text-sm sm:text-base font-bold text-foreground text-center leading-snug"
              isPlaying={isPlaying && isOnline}
              text={
                !isOnline
                  ? "Offline - Audio Streaming Paused"
                  : title || "Now Playing"
              }
            />
            <Typography
              truncate
              className="w-full text-[11px] sm:text-xs text-muted mt-0.5 text-center leading-tight"
              type="body-xs"
            >
              {!isOnline ? "Connect to internet to stream audio" : author}
            </Typography>
          </div>

          {/* Timeline & Scrubber */}
          <div className="w-full flex flex-col gap-0.5 px-1">
            {isLive ? (
              <Slider
                aria-label="Live stream progress"
                className="w-full pointer-events-none"
                maxValue={100}
                minValue={0}
                value={100}
              >
                <Slider.Track>
                  <Slider.Fill />
                </Slider.Track>
              </Slider>
            ) : (
              <Slider
                aria-label="Timeline scrubber"
                className="w-full"
                isDisabled={!isOnline || duration <= 0}
                maxValue={100}
                minValue={0}
                step={0.1}
                value={scrubberPercentage}
                onChange={(val) => {
                  const num = typeof val === "number" ? val : val[0];

                  if (duration > 0) {
                    seekTo((num / 100) * duration, true);
                  }
                }}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
            )}

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted tabular-nums">
              {isLive ? (
                <>
                  <span style={{ visibility: "hidden" }}>0:00</span>
                  <span className="inline-flex items-center gap-1 font-bold text-accent">
                    <span className="size-1.5 rounded-full bg-accent" />
                    LIVE
                  </span>
                </>
              ) : (
                <>
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
                </>
              )}
            </div>
          </div>

          {/* Controls Row: Left (Queue Toggle), Center (Play/Pause/Skip), Right (Volume) */}
          <div className="flex items-center justify-between px-1 w-full">
            {/* Left: Playlist Viewer Button (Disabled when no playlist tracks) */}
            <div className="flex items-center justify-start w-28 sm:w-32">
              <Button
                aria-label="Toggle tracklist queue"
                className={`h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 shadow-xs ${
                  !hasMultipleTracks
                    ? "opacity-35 border border-separator/30 bg-surface text-muted cursor-not-allowed"
                    : isTracklistOpen
                      ? "text-accent bg-accent/15 border border-accent/40 cursor-pointer"
                      : "text-foreground hover:bg-surface-secondary border border-separator/60 hover:border-separator/90 bg-surface cursor-pointer"
                }`}
                isDisabled={!hasMultipleTracks}
                size="sm"
                variant="ghost"
                onClick={() =>
                  hasMultipleTracks && setIsTracklistOpen((prev) => !prev)
                }
              >
                <ListMusic className="size-4 sm:size-4.5 text-accent shrink-0" />
                <span>Queue</span>
                {hasMultipleTracks && (
                  <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-surface-secondary border border-separator/40 text-muted font-semibold tabular-nums">
                    {tracklist.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Center: Playback Controls (Previous, Big Play/Pause, Next) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              {hasMultipleTracks && (
                <Button
                  isIconOnly
                  aria-label="Previous track"
                  className={`size-7 sm:size-8 rounded-full transition-colors duration-150 ${
                    !isOnline || currentTrackIndex <= 0
                      ? "opacity-30 cursor-not-allowed text-muted"
                      : "text-muted hover:text-foreground cursor-pointer"
                  }`}
                  isDisabled={!isOnline || currentTrackIndex <= 0}
                  size="sm"
                  variant="ghost"
                  onClick={prevTrack}
                >
                  <SkipBack className="size-3.5 sm:size-4 fill-current" />
                </Button>
              )}

              <Button
                isIconOnly
                aria-label={isPlaying ? "Pause" : "Play"}
                className={`size-9 sm:size-10 rounded-full shadow-lg transition-all duration-150 ${
                  !isOnline
                    ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    : "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 cursor-pointer"
                }`}
                isDisabled={!isOnline}
                size="md"
                variant="primary"
                onClick={togglePlay}
              >
                {isBuffering ? (
                  <Loader2 className="size-3.5 sm:size-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-3.5 sm:size-4 fill-current" />
                ) : (
                  <Play className="size-3.5 sm:size-4 fill-current" />
                )}
              </Button>

              {hasMultipleTracks && (
                <Button
                  isIconOnly
                  aria-label="Next track"
                  className={`size-7 sm:size-8 rounded-full transition-colors duration-150 ${
                    !isOnline || currentTrackIndex >= tracklist.length - 1
                      ? "opacity-30 cursor-not-allowed text-muted"
                      : "text-muted hover:text-foreground cursor-pointer"
                  }`}
                  isDisabled={
                    !isOnline || currentTrackIndex >= tracklist.length - 1
                  }
                  size="sm"
                  variant="ghost"
                  onClick={nextTrack}
                >
                  <SkipForward className="size-3.5 sm:size-4 fill-current" />
                </Button>
              )}
            </div>

            {/* Right: Volume Control */}
            <div className="flex items-center justify-end gap-1.5 w-28 sm:w-32">
              <button
                aria-label="Mute toggle"
                className="text-muted hover:text-foreground cursor-pointer shrink-0 transition-colors duration-150"
                type="button"
                onClick={toggleMute}
              >
                {volume === 0 ? (
                  <VolumeX className="size-4 sm:size-4.5" />
                ) : (
                  <Volume2 className="size-4 sm:size-4.5" />
                )}
              </button>
              <Slider
                aria-label="Volume slider"
                className="w-20 sm:w-24 md:w-28"
                maxValue={100}
                minValue={0}
                value={volume}
                onChange={(val) => {
                  const num = typeof val === "number" ? val : val[0];

                  setVolume(num);
                }}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
            </div>
          </div>

          {/* Expandable Tracklist with ScrollShadow */}
          {isTracklistOpen && (
            <ScrollShadow className="w-full max-h-24 sm:max-h-28 p-1.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-0.5 text-xs overflow-y-auto no-scrollbar">
              {tracklist.length > 0 ? (
                tracklist.map((track, idx) => (
                  <button
                    key={track.id + idx}
                    className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl text-left cursor-pointer transition-colors duration-150 ${
                      idx === currentTrackIndex
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-foreground hover:bg-surface"
                    }`}
                    type="button"
                    onClick={() => playTrackAt(idx)}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`text-[10px] sm:text-[11px] w-4 text-center tabular-nums shrink-0 ${
                          idx === currentTrackIndex
                            ? "text-accent font-bold"
                            : "text-muted"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{track.title}</span>
                        {track.author && (
                          <span className="text-[10px] text-muted truncate">
                            {track.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-2 text-center text-xs text-muted">
                  Single Track / Stream
                </div>
              )}
            </ScrollShadow>
          )}
        </>
      )}

      {/* Stream URL Input Bar */}
      <form
        className="w-full flex items-center gap-1.5 px-1"
        onSubmit={handleLoad}
      >
        <TextField fullWidth aria-label="Audio stream link">
          <InputGroup
            fullWidth
            className="bg-surface border border-separator/60 rounded-xl h-7.5 sm:h-8 text-xs"
          >
            <InputGroup.Input
              className="text-xs"
              disabled={!isOnline}
              placeholder={
                !isOnline
                  ? "Offline - Reconnect to play music..."
                  : "Paste Spotify or YouTube link..."
              }
              value={inputUrl}
              onChange={(event) => setInputUrl(event.target.value)}
            />
          </InputGroup>
        </TextField>
        <Button
          className="h-7.5 sm:h-8 px-3 rounded-xl text-xs font-semibold bg-accent text-accent-foreground cursor-pointer shadow-xs"
          isDisabled={!isOnline || !inputUrl.trim()}
          size="sm"
          type="submit"
          variant="primary"
        >
          Play
        </Button>
      </form>
    </div>
  );
}
