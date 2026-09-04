import { SubmitEvent, useState } from "react";
import {
  Typography,
  Button,
  Drawer,
  TextField,
  InputGroup,
  ScrollShadow,
  Slider,
} from "@heroui/react";
import {
  Settings,
  LayoutGrid,
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

import { useTodos } from "@/hooks/use-todos";
import { useTimer } from "@/hooks/use-timer";
import { SettingsModal } from "@/menus/settings/settings-modal";
import { SidebarTodoWidget } from "@/components/layout/sidebar-left";
import { SidebarClock, SidebarTimer } from "@/components/layout/sidebar";
import { useMusic } from "@/context/music-context";
import { ThemePopover } from "@/components/theme/theme-popover";
import { MarqueeTitle } from "@/components/music/marquee-title";
import { formatTime } from "@/config/playlists";

export function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerTracklistOpen, setIsDrawerTracklistOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const { todos } = useTodos();
  const { hasActiveSession } = useTimer();
  const {
    title,
    author,
    posterUrl,
    activePlatform,
    currentPlayingUrl,
    isPlaying,
    isBuffering,
    isLive,
    currentTime,
    duration,
    volume,
    tracklist,
    currentTrackIndex,
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

  const handleLoad = (e?: SubmitEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim(), undefined, undefined, true);

    if (success) setInputUrl("");
  };

  const activeTodoCount = todos.filter((t) => !t.completed).length;
  const scrubberVal = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasMultipleTracks = tracklist.length > 1;

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-20 md:h-24 items-center justify-between px-6 sm:px-8 md:px-12">
        <Typography
          className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground select-none"
          type="h1"
        >
          Cozify
        </Typography>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Quick Glance Trigger (Triggers at <= 950px) */}
          <Button
            isIconOnly
            aria-label="Open Workspace Widgets"
            className="flex min-[951px]:hidden size-9 md:size-10 rounded-2xl bg-surface/80 border text-foreground duration-200 cursor-pointer shadow-2xs relative"
            size="md"
            variant="ghost"
            onClick={() => setIsDrawerOpen(true)}
          >
            <LayoutGrid className="size-4 md:size-5" />
            {(activeTodoCount > 0 || hasActiveSession) && (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent ring-2 ring-background" />
            )}
          </Button>

          {/* Theme & Wallpapers (Appearance) Trigger */}
          <ThemePopover />

          {/* Settings Trigger */}
          <Button
            isIconOnly
            aria-label="Settings"
            className="size-9 md:size-10 rounded-2xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 text-foreground transition-[background-color,border-color] duration-200 cursor-pointer shadow-2xs"
            size="md"
            variant="ghost"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="size-4 md:size-5" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Mobile Glance Drawer */}
      <Drawer.Backdrop isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="h-full max-h-dvh flex flex-col justify-between p-4 sm:p-5 max-w-xs sm:max-w-sm w-full bg-surface/98 backdrop-blur-xl border-l border-separator shadow-2xl overflow-hidden">
            <Drawer.Header className="shrink-0 flex items-center justify-between pb-2 border-b border-separator/30">
              <Drawer.Heading className="text-base font-semibold flex items-center gap-2 text-foreground">
                <LayoutGrid className="size-4 text-accent" />
                <span>Widgets</span>
              </Drawer.Heading>
            </Drawer.Header>

            {/* 1. Sticky Top: Clock & Day Progress (Centered, bigger) */}
            <div className="shrink-0 pt-2 pb-2.5 border-b border-separator/20 flex flex-col gap-4 items-center justify-center w-full">
              <SidebarClock align="center" />
              <SidebarTimer align="center" />
            </div>

            {/* 2. Flexible Middle Area: To-Do Tasks taking remaining space */}
            <div className="flex-1 min-h-0 flex flex-col gap-1 py-2 overflow-hidden">
              <SidebarTodoWidget align="start" />
            </div>

            {/* 3. Sticky Bottom: Roomy & Unconstrained Music & Audio Player */}
            <div className="shrink-0 mt-auto pt-2 border-t border-separator/30 flex flex-col gap-2">
              <div className="w-full flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface/90 border border-separator/50 shadow-md">
                {/* Header: Status, Dynamic Platform Badge, Library Button */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
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
                      className="text-[10px] uppercase font-bold text-foreground tracking-wider"
                      type="body-xs"
                    >
                      {isBuffering
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
                      title="Open in platform"
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
                        setIsDrawerOpen(false);
                        setIsPickerOpen(true);
                      }}
                    >
                      <Disc3 className="size-3.5 text-accent" />
                    </Button>
                  </div>
                </div>

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
                          isPlaying={isPlaying}
                          text={title}
                        />
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
                          isPlaying && !isBuffering
                            ? "opacity-100"
                            : "opacity-0"
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
                      isDisabled={duration <= 0}
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
                        <span>
                          {duration > 0 ? formatTime(duration) : "0:00"}
                        </span>
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
                          currentTrackIndex <= 0
                            ? "opacity-30 cursor-not-allowed text-muted"
                            : "text-muted hover:text-foreground cursor-pointer"
                        }`}
                        disabled={currentTrackIndex <= 0}
                        type="button"
                        onClick={prevTrack}
                      >
                        <SkipBack className="size-4 fill-current" />
                      </button>
                    )}

                    <button
                      aria-label={isPlaying ? "Pause" : "Play"}
                      className="size-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all duration-150 cursor-pointer shadow-md"
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
                          currentTrackIndex >= tracklist.length - 1
                            ? "opacity-30 cursor-not-allowed text-muted"
                            : "text-muted hover:text-foreground cursor-pointer"
                        }`}
                        disabled={currentTrackIndex >= tracklist.length - 1}
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
                          : isDrawerTracklistOpen
                            ? "text-accent bg-accent/15 cursor-pointer"
                            : "text-muted hover:text-foreground cursor-pointer"
                      }`}
                      disabled={!hasMultipleTracks}
                      type="button"
                      onClick={() =>
                        hasMultipleTracks &&
                        setIsDrawerTracklistOpen((prev) => !prev)
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
                {isDrawerTracklistOpen && (
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
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </header>
  );
}
