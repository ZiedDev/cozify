import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Typography,
  Button,
  TextField,
  InputGroup,
  ScrollShadow,
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
  Music,
} from "lucide-react";
import gsap from "gsap";

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
    isPosterHidden,
    volume,
    currentTime,
    duration,
    tracklist,
    currentTrackIndex,
    currentPlayingUrl,
    spotifyEmbedUrl,
    togglePlay,
    seekTo,
    setVolume,
    nextTrack,
    prevTrack,
    playTrackAt,
    loadUrl,
    togglePicker,
    togglePosterPreview,
    bindYTPlayerElement,
  } = useMusic();

  const [inputUrl, setInputUrl] = useState("");
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubberVal, setScrubberVal] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  const discRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<number>(0);
  const velocityRef = useRef<{ speed: number }>({ speed: 0 });
  const speedTweenRef = useRef<gsap.core.Tween | null>(null);

  const isSpotify = activePlatform === "spotify";
  const isActuallyPlaying = isPlaying && !isBuffering && !isSpotify;

  // Dynamic aspect-ratio calculation for 1:1 media box fill
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
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = e.currentTarget;

    if (img.naturalWidth && img.naturalHeight) {
      setVideoAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  // Sync scrubber with currentTime when not scrubbing (YouTube mode)
  useEffect(() => {
    if (!isSpotify && !isScrubbing && duration > 0) {
      setScrubberVal((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isScrubbing, isSpotify]);

  // Car-like acceleration and braking physics
  useEffect(() => {
    if (isSpotify) return;

    if (isActuallyPlaying) {
      // Accelerate smoothly like stepping on the gas pedal in a car
      speedTweenRef.current?.kill();
      speedTweenRef.current = gsap.to(velocityRef.current, {
        speed: 24, // Cruising speed in degrees per second (~15s per rotation)
        duration: 2.8,
        ease: "power2.inOut",
      });
    } else {
      // Brake smoothly like pressing the brake pedal until coming to a complete stop
      speedTweenRef.current?.kill();
      speedTweenRef.current = gsap.to(velocityRef.current, {
        speed: 0,
        duration: 1.8,
        ease: "power2.out",
      });
    }
  }, [isActuallyPlaying, isSpotify]);

  // Continuous frame ticker to update angle with zero discontinuity
  useEffect(() => {
    if (isSpotify) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTime) / 1000);

      lastTime = now;

      if (velocityRef.current.speed > 0.001 && discRef.current) {
        rotationRef.current =
          (rotationRef.current + velocityRef.current.speed * deltaSec) % 360000;
        discRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      speedTweenRef.current?.kill();
    };
  }, [isSpotify]);

  // Smooth subtle fade transition on track change
  useEffect(() => {
    if (!isSpotify && metaRef.current) {
      gsap.fromTo(
        metaRef.current,
        { y: 4, opacity: 0.6 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
      );
    }
  }, [title, isSpotify]);

  const handleLoad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim());

    if (success) setInputUrl("");
  };

  const hasMultipleTracks = tracklist.length > 1;

  // Auto-close tracklist drawer if tracklist becomes empty
  useEffect(() => {
    if (!hasMultipleTracks && isTracklistOpen) {
      setIsTracklistOpen(false);
    }
  }, [hasMultipleTracks, isTracklistOpen]);

  return (
    <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-3 p-2 bg-transparent border-none shadow-none pointer-events-auto select-none">
      {/* Top Header: Platform Link & Library Trigger (No status indicator for Spotify) */}
      <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {!isSpotify && (
            <>
              <span
                className={`size-2 rounded-full ${
                  isBuffering
                    ? "bg-amber-400 animate-ping"
                    : isPlaying
                      ? "bg-accent animate-pulse"
                      : "bg-muted/50"
                }`}
              />
              <Typography
                truncate
                className="text-[10px] uppercase tracking-wider font-bold text-foreground"
                type="body-xs"
              >
                {isBuffering ? "Loading..." : isPlaying ? "Now Playing" : "Paused"}
              </Typography>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Dynamic Chip with 'Open in' Text */}
          <a
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-[transform,background-color] duration-150 hover:scale-105 ${
              isSpotify
                ? "text-[#1db954] bg-[#1db954]/10 border-[#1db954]/25 hover:bg-[#1db954]/20"
                : "text-[#ff4e4e] bg-[#ff0000]/10 border-[#ff0000]/25 hover:bg-[#ff0000]/20"
            }`}
            href={currentPlayingUrl}
            rel="noopener noreferrer"
            target="_blank"
            title={isSpotify ? "Open in Spotify" : "Open in YouTube"}
          >
            {isSpotify ? (
              <svg className="size-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.306c-.215.352-.676.463-1.028.247-2.816-1.72-6.36-2.109-10.536-1.155-.403.093-.804-.158-.897-.562-.093-.403.158-.804.562-.897 4.571-1.045 8.492-.596 11.652 1.339.352.216.463.676.247 1.028zm1.467-3.262c-.27.44-.848.578-1.288.308-3.224-1.982-8.14-2.557-11.954-1.399-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.364-1.324 9.791-.682 13.48 1.589.44.27.578.848.308 1.288zm.126-3.41c-3.867-2.296-10.248-2.508-13.941-1.387-.593.18-1.22-.164-1.4-.757-.18-.593.164-1.22.757-1.4 4.248-1.29 11.294-1.037 15.741 1.603.533.316.707 1.01.391 1.543-.316.533-1.01.707-1.543.391z" />
              </svg>
            ) : (
              <svg className="size-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            )}
            <span>Open in {isSpotify ? "Spotify" : "YouTube"}</span>
          </a>

          {/* Button with Playlists text */}
          <Button
            className="h-7 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 text-muted hover:text-foreground border border-separator/40 hover:border-separator/80 bg-surface/60 cursor-pointer"
            size="sm"
            variant="secondary"
            onClick={togglePicker}
          >
            <Disc3 className="size-3.5 text-accent" />
            <span>Playlists</span>
          </Button>
        </div>
      </div>

      {/* Spotify Mode: Only the Spotify Player in the middle without fancy controls */}
      {isSpotify && spotifyEmbedUrl ? (
        <div className="w-full h-88 sm:h-96 rounded-2xl overflow-hidden border border-separator/40 bg-surface-secondary/60 shadow-xl my-1">
          <iframe
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
            className="relative size-48 sm:size-56 md:size-60 my-2 shadow-2xl overflow-hidden bg-black ring-2 ring-white/15 transition-[border-radius,box-shadow,transform] duration-400 ease-in-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none text-left p-0 border-none outline-none focus-visible:ring-2 focus-visible:ring-accent group shrink-0"
            style={{
              borderRadius: isPosterHidden ? "1.5rem" : "50%",
            }}
            title={
              isPosterHidden
                ? "Click to switch to Vinyl"
                : "Click to watch Video"
            }
            type="button"
            onClick={togglePosterPreview}
          >
            {/* 1. Square Center-Cropped Native YouTube Video Layer */}
            <div
              className={`video-crop-wrapper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-[opacity,transform] duration-400 ease-in-out [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-none [&_div]:w-full [&_div]:h-full ${
                isPosterHidden
                  ? "scale-100 opacity-100 pointer-events-auto"
                  : "scale-95 opacity-0 pointer-events-none"
              }`}
              style={cropStyle}
            >
              <div ref={bindYTPlayerElement} className="w-full h-full" />
            </div>

            {/* 2. Round Vinyl Disc Layer with Clean Scale, Blur & Brightness Transition */}
            <div
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-[opacity,transform,filter] duration-400 ease-in-out ${
                isPosterHidden
                  ? "opacity-0 scale-110 blur-sm brightness-110 pointer-events-none"
                  : "opacity-100 scale-100 blur-0 brightness-100 pointer-events-auto"
              }`}
            >
              {/* Vinyl Grooves & Image with GSAP Controlled Velocity Spin */}
              <div
                ref={discRef}
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative shadow-inner"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle at center, transparent 18px, black 19px)",
                  maskImage:
                    "radial-gradient(circle at center, transparent 18px, black 19px)",
                }}
              >
                {posterUrl ? (
                  <img
                    alt={title}
                    className="w-full h-full object-cover rounded-full select-none pointer-events-none shadow-inner"
                    src={posterUrl}
                    onLoad={handlePosterLoad}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent/20 text-accent rounded-full">
                    <Music className="size-10" />
                  </div>
                )}
              </div>

              {/* Center Spindle Ring (Transparent center revealing app wallpaper background) */}
              <div
                className={`absolute size-9 rounded-full bg-transparent border-2 border-white/30 shadow-inner flex items-center justify-center pointer-events-none ring-1 ring-black/50 transition-[opacity,transform] duration-300 ${
                  isPosterHidden
                    ? "opacity-0 scale-75"
                    : "opacity-100 scale-100"
                }`}
              />
            </div>

            {/* Glass Inset Ring */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 z-20 group-hover:ring-white/25 transition-opacity" />
          </button>

          {/* Track Metadata with subtle transition */}
          <div
            ref={metaRef}
            className="flex flex-col items-center text-center w-full px-2"
          >
            <Typography
              truncate
              className="font-serif text-base sm:text-lg font-bold text-foreground max-w-full leading-snug drop-shadow-xs"
              type="h4"
            >
              {title}
            </Typography>
            <Typography
              truncate
              className="text-xs text-muted max-w-full mt-0.5 font-light"
              type="body-xs"
            >
              {author}
            </Typography>
          </div>

          {/* Cozy Scrubber Timeline (Knob-less when Live) */}
          <div className="w-full flex flex-col gap-1 px-2">
            {isLive ? (
              <div className="w-full h-1.5 rounded-full bg-accent/80 shadow-[0_0_8px_var(--accent)]" />
            ) : (
              <input
                aria-label="Timeline scrubber"
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
                disabled={duration <= 0}
                max={100}
                min={0}
                step="0.1"
                style={{
                  background:
                    duration > 0
                      ? `linear-gradient(to right, var(--accent) ${scrubberVal}%, var(--separator) ${scrubberVal}%)`
                      : undefined,
                  accentColor: "var(--accent)",
                }}
                type="range"
                value={scrubberVal}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const val = Number((e.target as HTMLInputElement).value);

                  setScrubberVal(val);
                }}
                onChange={(e) => {
                  const val = Number(e.target.value);

                  setScrubberVal(val);
                  if (duration > 0) {
                    seekTo((val / 100) * duration, true);
                  }
                }}
                onMouseDown={() => setIsScrubbing(true)}
                onMouseUp={() => setIsScrubbing(false)}
                onTouchEnd={() => setIsScrubbing(false)}
                onTouchStart={() => setIsScrubbing(true)}
              />
            )}

            <div className="flex items-center justify-between text-[10px] text-muted tabular-nums">
              {isLive ? (
                <>
                  <span style={{ visibility: "hidden" }}>0:00</span>
                  <span className="inline-flex items-center gap-1 font-bold text-accent tracking-wider">
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
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

          {/* Tactical 3-Column Controls Row: Left (Playlist Viewer), Center (Play Controls), Right (Volume) */}
          <div className="w-full flex items-center justify-between px-1 pt-1">
            {/* Left: Playlist Viewer Button (Disabled when no playlist tracks) */}
            <div className="flex items-center justify-start w-24">
              <Button
                isIconOnly
                aria-label="Toggle tracklist"
                className={`size-8 rounded-full transition-[background-color,border-color,color,opacity] duration-150 ${
                  !hasMultipleTracks
                    ? "opacity-35 cursor-not-allowed border border-separator/20"
                    : isTracklistOpen
                      ? "text-accent bg-accent/15 border border-accent/30 cursor-pointer"
                      : "text-muted hover:text-foreground hover:bg-surface border border-separator/40 cursor-pointer"
                }`}
                isDisabled={!hasMultipleTracks}
                size="sm"
                variant="ghost"
                onClick={() =>
                  hasMultipleTracks && setIsTracklistOpen((prev) => !prev)
                }
              >
                <ListMusic className="size-4" />
              </Button>
            </div>

            {/* Center: Playback Controls (Previous, Big Play/Pause, Next) */}
            <div className="flex items-center justify-center gap-2">
              {hasMultipleTracks && (
                <Button
                  isIconOnly
                  aria-label="Previous track"
                  className="size-8 rounded-full text-muted hover:text-foreground cursor-pointer"
                  size="sm"
                  variant="ghost"
                  onClick={prevTrack}
                >
                  <SkipBack className="size-4 fill-current" />
                </Button>
              )}

              <Button
                isIconOnly
                aria-label={isPlaying ? "Pause" : "Play"}
                className="size-11 rounded-full bg-foreground text-background shadow-lg hover:scale-106 active:scale-95 transition-transform cursor-pointer"
                size="md"
                variant="primary"
                onClick={togglePlay}
              >
                {isBuffering ? (
                  <Loader2 className="size-4 animate-spin text-background" />
                ) : isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 fill-current ml-0.5" />
                )}
              </Button>

              {hasMultipleTracks && (
                <Button
                  isIconOnly
                  aria-label="Next track"
                  className="size-8 rounded-full text-muted hover:text-foreground cursor-pointer"
                  size="sm"
                  variant="ghost"
                  onClick={nextTrack}
                >
                  <SkipForward className="size-4 fill-current" />
                </Button>
              )}
            </div>

            {/* Right: Volume Control */}
            <div className="flex items-center justify-end gap-1.5 w-24">
              <button
                aria-label="Mute toggle"
                className="text-muted hover:text-foreground cursor-pointer shrink-0"
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 80)}
              >
                {volume === 0 ? (
                  <VolumeX className="size-3.5" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
              </button>
              <input
                aria-label="Volume slider"
                className="w-16 h-1.5 rounded-full appearance-none cursor-pointer outline-none"
                max={100}
                min={0}
                style={{
                  background: `linear-gradient(to right, var(--accent) ${volume}%, var(--separator) ${volume}%)`,
                  accentColor: "var(--accent)",
                }}
                type="range"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Expandable Tracklist with ScrollShadow */}
          {isTracklistOpen && (
            <ScrollShadow className="w-full max-h-28 p-1.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-0.5 text-[11px] mt-1 overflow-y-auto no-scrollbar">
              {tracklist.length > 0 ? (
                tracklist.map((track, idx) => (
                  <button
                    key={track.id + idx}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-left cursor-pointer transition-[background-color,color] duration-150 ${
                      idx === currentTrackIndex
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-foreground hover:bg-surface"
                    }`}
                    type="button"
                    onClick={() => playTrackAt(idx)}
                  >
                    <span className="truncate">{track.title}</span>
                  </button>
                ))
              ) : (
                <div className="p-2 text-center text-[10px] text-muted">
                  Single Track / Stream
                </div>
              )}
            </ScrollShadow>
          )}
        </>
      )}

      {/* Stream URL Input Bar */}
      <form
        className="w-full flex items-center gap-1.5 pt-1 px-1"
        onSubmit={handleLoad}
      >
        <TextField fullWidth aria-label="Audio stream link">
          <InputGroup
            fullWidth
            className="bg-surface/50 backdrop-blur-md border border-separator/40 rounded-xl h-8 text-xs"
          >
            <InputGroup.Input
              className="text-xs"
              placeholder="Paste Spotify or YouTube link..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
          </InputGroup>
        </TextField>
        <Button
          className="h-8 px-3 rounded-xl text-xs font-semibold"
          isDisabled={!inputUrl.trim()}
          size="sm"
          type="submit"
          variant="primary"
        >
          Load
        </Button>
      </form>
    </div>
  );
}
