import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
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
  ChevronDown,
  Loader2,
  Music,
} from "lucide-react";

import { useMusic } from "@/context/music-context";
import { AppMode } from "@/config/modes";
import { formatTime } from "@/config/playlists";

interface MusicWidgetProps {
  activeMode?: AppMode;
}

export function MusicWidget({ activeMode }: MusicWidgetProps) {
  const {
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
    tracklist,
    currentTrackIndex,
    isDeckOpen,
    setIsDeckOpen,
    spotifyEmbedUrl,
    currentPlayingUrl,
    togglePlay,
    seekTo,
    setVolume,
    nextTrack,
    prevTrack,
    playTrackAt,
    loadUrl,
    togglePicker,
  } = useMusic();

  const [inputUrl, setInputUrl] = useState("");
  const [isDrawerActive, setIsDrawerActive] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubberVal, setScrubberVal] = useState(0);

  // Sync scrubber with currentTime when not scrubbing
  useEffect(() => {
    if (!isScrubbing && duration > 0) {
      setScrubberVal((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isScrubbing]);

  // Auto-close tracklist drawer if tracklist becomes empty
  useEffect(() => {
    if (tracklist.length <= 1 && isDrawerActive) {
      setIsDrawerActive(false);
    }
  }, [tracklist.length, isDrawerActive]);

  const handleLoad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim());

    if (success) setInputUrl("");
  };

  const hasMultipleTracks = tracklist.length > 1;

  // Mini music player only hides in the music menu
  const isHidden = activeMode === "music";

  return (
    <div
      className={`hidden ${
        !isHidden ? "min-[951px]:flex" : ""
      } fixed bottom-4 sm:bottom-6 left-4 md:left-6 lg:left-8 xl:left-12 z-40 select-none pointer-events-none`}
    >
      <div className="relative">
        {/* 1. Minimized Floating Miniplayer Pill (Exact dock matching styling, color, height, and padding) */}
        <div
          className={`rounded-full bg-surface/95 border border-separator/40 shadow-lg p-1 origin-bottom-left transition-[transform,opacity] duration-300 ease-out ${
            !isDeckOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-90 translate-y-2 pointer-events-none absolute bottom-0 left-0"
          }`}
        >
          <button
            className="flex items-center gap-1.5 min-[701px]:gap-2 rounded-full px-3 min-[701px]:px-5 py-2 min-[701px]:py-2.5 text-xs min-[701px]:text-sm md:text-base font-medium whitespace-nowrap text-foreground cursor-pointer transition-opacity duration-150 hover:opacity-85 active:opacity-75 max-w-37.5 min-[1260px]:max-w-52.5"
            title="Open Audio Deck"
            type="button"
            onClick={() => setIsDeckOpen(true)}
          >
            {/* Direct Music/Loading Icon without circular wrapper */}
            {isBuffering ? (
              <Loader2 className="size-4 min-[701px]:size-4.5 animate-spin text-accent shrink-0" />
            ) : (
              <Music className="size-4 min-[701px]:size-4.5 text-accent shrink-0" />
            )}

            {/* Wide Screens (> 1260px): Full Song Title */}
            <span className="hidden min-[1260px]:inline truncate font-medium flex-1 text-left">
              {title}
            </span>

            {/* Overlap / Narrow Screens (<= 1260px): Shortened Status */}
            <span className="inline min-[1260px]:hidden font-medium text-muted capitalize truncate">
              {activePlatform === "spotify"
                ? "Spotify"
                : isBuffering
                  ? "Loading"
                  : isPlaying
                    ? "Playing"
                    : "Paused"}
            </span>

            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3 min-[701px]:h-3.5 shrink-0">
                <span className="w-0.5 h-full bg-accent rounded-full animate-bounce" />
                <span
                  className="w-0.5 h-2/3 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-0.5 h-4/5 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </button>
        </div>

        {/* 2. Expanded Floating Audio Deck (Smoothly expands from origin-bottom-left) */}
        <div
          className={`absolute bottom-0 left-0 w-[92vw] sm:w-105 p-3.5 rounded-3xl bg-surface/95 backdrop-blur-2xl border border-separator/70 shadow-2xl flex flex-col gap-2.5 origin-bottom-left transition-[transform,opacity] duration-300 ease-out z-50 overflow-hidden ${
            isDeckOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-90 translate-y-3 pointer-events-none"
          }`}
        >
          {/* Top Header: Title, Clickable Platform Badge, Actions */}
          <div className="flex items-center justify-between pb-1 px-1">
            <div className="flex items-center gap-2 min-w-0">
              {activePlatform !== "spotify" && (
                <>
                  <span
                    className={`size-2 rounded-full ${
                      isBuffering
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
                    {isBuffering
                      ? "Loading..."
                      : isPlaying
                        ? "Now Playing"
                        : "Paused"}
                  </Typography>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Dynamic Clickable Platform Badge with 'Open in' */}
              <a
                className={`inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${
                  activePlatform === "spotify"
                    ? "text-[#1db954] bg-[#1db954]/10 border-[#1db954]/25 hover:bg-[#1db954]/20"
                    : "text-[#ff4e4e] bg-[#ff0000]/10 border-[#ff0000]/25 hover:bg-[#ff0000]/20"
                }`}
                href={currentPlayingUrl}
                rel="noopener noreferrer"
                target="_blank"
                title={
                  activePlatform === "spotify"
                    ? "Open in Spotify"
                    : "Open in YouTube"
                }
              >
                {activePlatform === "spotify" ? (
                  <svg
                    className="size-3.5 fill-current shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.306c-.215.352-.676.463-1.028.247-2.816-1.72-6.36-2.109-10.536-1.155-.403.093-.804-.158-.897-.562-.093-.403.158-.804.562-.897 4.571-1.045 8.492-.596 11.652 1.339.352.216.463.676.247 1.028zm1.467-3.262c-.27.44-.848.578-1.288.308-3.224-1.982-8.14-2.557-11.954-1.399-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.364-1.324 9.791-.682 13.48 1.589.44.27.578.848.308 1.288zm.126-3.41c-3.867-2.296-10.248-2.508-13.941-1.387-.593.18-1.22-.164-1.4-.757-.18-.593.164-1.22.757-1.4 4.248-1.29 11.294-1.037 15.741 1.603.533.316.707 1.01.391 1.543-.316.533-1.01.707-1.543.391z" />
                  </svg>
                ) : (
                  <svg
                    className="size-3.5 fill-current shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                )}
                <span className="hidden sm:inline">
                  Open in {activePlatform === "spotify" ? "Spotify" : "YouTube"}
                </span>
              </a>

              {/* Browse Playlists Modal Trigger with 'Playlists' text */}
              <Button
                className="h-6 px-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 text-muted hover:text-foreground border border-separator/40 hover:border-separator/80 bg-surface/60 cursor-pointer transition-colors duration-150"
                size="sm"
                variant="secondary"
                onClick={togglePicker}
              >
                <Disc3 className="size-3 text-accent" />
                <span>Playlists</span>
              </Button>

              {/* Minimize button */}
              <Button
                isIconOnly
                aria-label="Minimize Audio Deck"
                className="size-6 rounded-full text-muted hover:text-foreground cursor-pointer transition-colors duration-150"
                size="sm"
                variant="ghost"
                onClick={() => setIsDeckOpen(false)}
              >
                <ChevronDown className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Spotify Embed Player View with clean fixed height and no overflow */}
          {activePlatform === "spotify" && spotifyEmbedUrl && (
            <div className="w-full h-38 rounded-2xl overflow-hidden border border-separator/40 bg-surface-secondary/60 shrink-0">
              <iframe
                allow="encrypted-media; fullscreen; picture-in-picture"
                className="w-full h-full border-none block"
                src={spotifyEmbedUrl}
                title="Spotify Audio Player"
              />
            </div>
          )}

          {/* YouTube Audio Player Card */}
          <div
            className={`relative p-3 rounded-2xl bg-surface-secondary/70 border border-separator/50 flex gap-3 overflow-hidden shadow-inner ${
              activePlatform === "youtube" ? "flex" : "hidden"
            }`}
          >
            {/* 1:1 Media Box (128x128px) with Clean High-Res Artwork */}
            <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-black relative shadow-md">
              <img
                alt={title}
                className="w-full h-full object-cover pointer-events-none"
                src={
                  posterUrl ||
                  "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg"
                }
              />
              {/* Glass Inset Border */}
              <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-white/10" />
            </div>

            {/* Right Content Column: Metadata, Scrubber, Controls */}
            <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
              {/* Title, Artist, and 4-Bar Equalizer Animation */}
              <div className="flex items-start justify-between gap-1.5 min-w-0">
                <div className="min-w-0 flex flex-col flex-1">
                  <Typography
                    truncate
                    className="text-xs sm:text-sm font-bold text-foreground leading-tight"
                    type="body-sm"
                  >
                    {title}
                  </Typography>
                  <Typography
                    truncate
                    className="text-[11px] text-muted mt-0.5"
                    type="body-xs"
                  >
                    {author}
                  </Typography>
                </div>

                {/* 4-Bar Equalizer Animation */}
                <div
                  className={`flex items-end gap-0.5 h-3.5 shrink-0 transition-opacity duration-200 ${
                    isPlaying && !isBuffering ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span
                    className="w-0.5 bg-accent rounded-xs animate-bounce"
                    style={{
                      height: "40%",
                      animationDuration: "0.8s",
                      animationDelay: "0.1s",
                    }}
                  />
                  <span
                    className="w-0.5 bg-accent rounded-xs animate-bounce"
                    style={{
                      height: "90%",
                      animationDuration: "0.8s",
                      animationDelay: "0.3s",
                    }}
                  />
                  <span
                    className="w-0.5 bg-accent rounded-xs animate-bounce"
                    style={{
                      height: "60%",
                      animationDuration: "0.8s",
                      animationDelay: "0.2s",
                    }}
                  />
                  <span
                    className="w-0.5 bg-accent rounded-xs animate-bounce"
                    style={{
                      height: "30%",
                      animationDuration: "0.8s",
                      animationDelay: "0.4s",
                    }}
                  />
                </div>
              </div>

              {/* Timeline Scrubber */}
              <div className="flex flex-col gap-1 my-1">
                <input
                  aria-label="Timeline scrubber"
                  className={`w-full h-1.5 rounded-full appearance-none outline-none transition-opacity ${
                    isLive ? "pointer-events-none bg-accent" : "cursor-pointer"
                  }`}
                  disabled={isLive || duration <= 0}
                  max={100}
                  min={0}
                  step="0.1"
                  style={{
                    background:
                      !isLive && duration > 0
                        ? `linear-gradient(to right, var(--accent) ${scrubberVal}%, var(--separator) ${scrubberVal}%)`
                        : undefined,
                    accentColor: "var(--accent)",
                  }}
                  type="range"
                  value={isLive ? 100 : scrubberVal}
                  onChange={(e) => {
                    const val = Number(e.target.value);

                    setScrubberVal(val);
                    if (duration > 0) {
                      seekTo((val / 100) * duration, true);
                    }
                  }}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const val = Number((e.target as HTMLInputElement).value);

                    setScrubberVal(val);
                  }}
                  onMouseDown={() => setIsScrubbing(true)}
                  onMouseUp={() => setIsScrubbing(false)}
                  onTouchEnd={() => setIsScrubbing(false)}
                  onTouchStart={() => setIsScrubbing(true)}
                />

                <div className="flex items-center justify-between text-[10px] text-muted tabular-nums">
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
                      <span>
                        {duration > 0 ? formatTime(duration) : "0:00"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-2">
                {/* Playback buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Previous button (Only shown if multi-track playlist) */}
                  {hasMultipleTracks && (
                    <button
                      aria-label="Previous track"
                      className="p-1 rounded-full text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
                      type="button"
                      onClick={prevTrack}
                    >
                      <SkipBack className="size-4 fill-current" />
                    </button>
                  )}

                  {/* 32x32 Play/Pause circle button */}
                  <button
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="size-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 active:scale-95 transition-opacity duration-150 cursor-pointer shadow-md"
                    type="button"
                    onClick={togglePlay}
                  >
                    {isBuffering ? (
                      <Loader2 className="size-3.5 animate-spin text-background" />
                    ) : isPlaying ? (
                      <Pause className="size-3.5 fill-current" />
                    ) : (
                      <Play className="size-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Next button (Only shown if multi-track playlist) */}
                  {hasMultipleTracks && (
                    <button
                      aria-label="Next track"
                      className="p-1 rounded-full text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
                      type="button"
                      onClick={nextTrack}
                    >
                      <SkipForward className="size-4 fill-current" />
                    </button>
                  )}
                </div>

                {/* Volume & Tracklist Drawer Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Toggle tracklist"
                    className={`p-1 rounded-md transition-colors duration-150 ${
                      !hasMultipleTracks
                        ? "opacity-35 cursor-not-allowed text-muted"
                        : isDrawerActive
                          ? "text-accent bg-accent/15 cursor-pointer"
                          : "text-muted hover:text-foreground cursor-pointer"
                    }`}
                    disabled={!hasMultipleTracks}
                    type="button"
                    onClick={() =>
                      hasMultipleTracks && setIsDrawerActive((prev) => !prev)
                    }
                  >
                    <ListMusic className="size-4" />
                  </button>

                  <div className="flex items-center gap-1.5 w-20">
                    <button
                      aria-label="Mute toggle"
                      className="text-muted hover:text-foreground cursor-pointer shrink-0 transition-colors duration-150"
                      type="button"
                      onClick={() => setVolume(volume > 0 ? 0 : 80)}
                    >
                      {volume === 0 ? (
                        <VolumeX className="size-3" />
                      ) : (
                        <Volume2 className="size-3" />
                      )}
                    </button>
                    <input
                      aria-label="Volume slider"
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
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
              </div>
            </div>
          </div>

          {/* Collapsible Playlist Tracklist Drawer with ScrollShadow */}
          {isDrawerActive && (
            <ScrollShadow className="max-h-40 p-1.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs overflow-y-auto no-scrollbar">
              {tracklist.length > 0 ? (
                tracklist.map((track, idx) => (
                  <button
                    key={track.id + idx}
                    className={`flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-colors duration-150 ${
                      idx === currentTrackIndex
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-foreground hover:bg-surface"
                    }`}
                    type="button"
                    onClick={() => playTrackAt(idx)}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`text-[11px] w-4 text-center tabular-nums ${
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
                <div className="p-3 text-center text-xs text-muted flex items-center justify-center gap-2">
                  <span className="truncate">
                    {title || "Current Single Stream"}
                  </span>
                </div>
              )}
            </ScrollShadow>
          )}

          {/* Stream URL Input Bar */}
          <form
            className="flex items-center gap-1.5 pt-0.5"
            onSubmit={handleLoad}
          >
            <TextField fullWidth aria-label="Audio stream link">
              <InputGroup
                fullWidth
                className="bg-surface border border-separator/40 rounded-xl h-8 text-xs"
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
              Play
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
