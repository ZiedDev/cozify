import { useState, SubmitEvent } from "react";
import {
  Typography,
  Button,
  TextField,
  InputGroup,
  ScrollShadow,
  Slider,
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
} from "lucide-react";

import { MarqueeTitle } from "./marquee-title";

import { useMusic } from "@/context/music-context";
import { formatTime } from "@/config/playlists";

interface DrawerMusicPlayerProps {
  onCloseDrawer: () => void;
}

export function DrawerMusicPlayer({ onCloseDrawer }: DrawerMusicPlayerProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);

  const {
    title,
    author,
    posterUrl,
    activePlatform,
    currentPlayingUrl,
    spotifyEmbedUrl,
    isPlaying,
    isBuffering,
    isOnline,
    isLive,
    currentTime,
    duration,
    volume,
    tracklist,
    currentTrackIndex,
    playerKey,
    togglePlay,
    prevTrack,
    nextTrack,
    seekTo,
    setVolume,
    toggleMute,
    playTrackAt,
    loadUrl,
    setIsPickerOpen,
  } = useMusic();

  const handleLoad = (event?: SubmitEvent) => {
    if (event) event.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim(), undefined, undefined, true);

    if (success) setInputUrl("");
  };

  const scrubberVal = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasMultipleTracks = tracklist.length > 1;

  return (
    <div className="w-full flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface/90 border border-separator/50 shadow-md">
      {/* Header: Status, Dynamic Platform Badge, Library Button */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`size-2 rounded-full ${
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
            className="text-[10px] uppercase font-bold text-foreground tracking-wider"
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

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-[transform,background-color] duration-150 hover:scale-105 ${
              activePlatform === "spotify"
                ? "text-[#1db954] bg-[#1db954]/10 border-[#1db954]/25 hover:bg-[#1db954]/20"
                : "text-[#ff4e4e] bg-[#ff0000]/10 border-[#ff0000]/25 hover:bg-[#ff0000]/20"
            }`}
            href={currentPlayingUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {activePlatform === "spotify" ? "Spotify" : "YouTube"}
          </a>

          <Button
            isIconOnly
            aria-label="Library"
            className="size-5 rounded-full text-muted hover:text-foreground"
            size="sm"
            variant="ghost"
            onClick={() => {
              onCloseDrawer();
              setIsPickerOpen(true);
            }}
          >
            <Disc3 className="size-3.5 text-accent" />
          </Button>
        </div>
      </div>

      {/* Spotify Embed Player View if Spotify is active */}
      {activePlatform === "spotify" && spotifyEmbedUrl ? (
        <div className="w-full h-36 rounded-xl overflow-hidden border border-separator/40 bg-surface-secondary/60 shrink-0">
          <iframe
            key={`drawer-spotify-${playerKey}`}
            allow="encrypted-media; fullscreen; picture-in-picture"
            className="w-full h-full border-none block"
            src={spotifyEmbedUrl}
            title="Spotify Audio Player"
          />
        </div>
      ) : (
        <>
          {/* Track Row: Thumbnail + Info */}
          <div className="w-full flex items-center gap-3">
            <div className="size-12 rounded-xl overflow-hidden bg-black relative shrink-0 shadow-sm ring-1 ring-inset ring-white/10">
              <img
                alt={title}
                className="w-full h-full object-cover pointer-events-none"
                src={
                  posterUrl ||
                  "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg"
                }
              />
            </div>

            <div className="min-w-0 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-start justify-between gap-1.5 min-w-0">
                <div className="min-w-0 flex flex-col flex-1 overflow-hidden">
                  <MarqueeTitle
                    className="text-xs sm:text-sm font-bold text-foreground leading-tight"
                    isPlaying={isPlaying && isOnline}
                    text={!isOnline ? "Offline - Audio Player Paused" : title}
                  />
                  <Typography
                    truncate
                    className="text-[11px] text-muted mt-0.5"
                    type="body-xs"
                  >
                    {!isOnline ? "Connect to internet to stream" : author}
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
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-1 w-full">
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
                value={scrubberVal}
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
                  <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
                </>
              )}
            </div>
          </div>

          {/* Controls & Volume Row */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              {hasMultipleTracks && (
                <button
                  aria-label="Previous track"
                  className={`p-1 rounded-full transition-colors duration-150 ${
                    !isOnline || currentTrackIndex <= 0
                      ? "opacity-30 cursor-not-allowed text-muted"
                      : "text-muted hover:text-foreground cursor-pointer"
                  }`}
                  disabled={!isOnline || currentTrackIndex <= 0}
                  type="button"
                  onClick={prevTrack}
                >
                  <SkipBack className="size-4 fill-current" />
                </button>
              )}

              <button
                aria-label={isPlaying ? "Pause" : "Play"}
                className={`size-8 rounded-full flex items-center justify-center transition-all duration-150 shadow-md ${
                  !isOnline
                    ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    : "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 cursor-pointer"
                }`}
                disabled={!isOnline}
                type="button"
                onClick={togglePlay}
              >
                {isBuffering ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-3.5 fill-current" />
                ) : (
                  <Play className="size-3.5 fill-current" />
                )}
              </button>

              {hasMultipleTracks && (
                <button
                  aria-label="Next track"
                  className={`p-1 rounded-full transition-colors duration-150 ${
                    !isOnline || currentTrackIndex >= tracklist.length - 1
                      ? "opacity-30 cursor-not-allowed text-muted"
                      : "text-muted hover:text-foreground cursor-pointer"
                  }`}
                  disabled={
                    !isOnline || currentTrackIndex >= tracklist.length - 1
                  }
                  type="button"
                  onClick={nextTrack}
                >
                  <SkipForward className="size-4 fill-current" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                aria-label="Toggle tracklist"
                className={`p-1 rounded-md transition-colors duration-150 ${
                  !hasMultipleTracks
                    ? "opacity-35 cursor-not-allowed text-muted"
                    : isTracklistOpen
                      ? "text-accent bg-accent/15 cursor-pointer"
                      : "text-muted hover:text-foreground cursor-pointer"
                }`}
                disabled={!hasMultipleTracks}
                type="button"
                onClick={() =>
                  hasMultipleTracks && setIsTracklistOpen((prev) => !prev)
                }
              >
                <ListMusic className="size-4" />
              </button>

              <div className="flex items-center gap-1.5 w-20 sm:w-24">
                <button
                  aria-label="Mute toggle"
                  className="text-muted hover:text-foreground cursor-pointer shrink-0 transition-colors duration-150"
                  type="button"
                  onClick={toggleMute}
                >
                  {volume === 0 ? (
                    <VolumeX className="size-3" />
                  ) : (
                    <Volume2 className="size-3" />
                  )}
                </button>
                <Slider
                  aria-label="Volume slider"
                  className="w-full"
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
          </div>

          {/* Collapsible Playlist Tracklist Drawer with ScrollShadow */}
          {isTracklistOpen && (
            <ScrollShadow className="max-h-36 p-1.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs overflow-y-auto no-scrollbar">
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
        </>
      )}

      {/* Stream URL Input Bar */}
      <form className="flex items-center gap-1.5 pt-0.5" onSubmit={handleLoad}>
        <TextField fullWidth aria-label="Audio stream link">
          <InputGroup
            fullWidth
            className="bg-surface border border-separator/40 rounded-xl h-8 text-xs"
          >
            <InputGroup.Input
              className="text-xs"
              disabled={!isOnline}
              placeholder={
                !isOnline
                  ? "Offline - Reconnect to play..."
                  : "Paste Spotify or YouTube link..."
              }
              value={inputUrl}
              onChange={(event) => setInputUrl(event.target.value)}
            />
          </InputGroup>
        </TextField>
        <Button
          className="h-8 px-3 rounded-xl text-xs font-semibold"
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
