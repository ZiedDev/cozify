import React, { useState } from "react";
import {
  Typography,
  Button,
  Drawer,
  TextField,
  InputGroup,
  ScrollShadow,
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
  Music,
  Disc3,
  Loader2,
} from "lucide-react";

import { useTodos } from "@/hooks/use-todos";
import { useTimer } from "@/hooks/use-timer";
import { SettingsModal } from "@/components/settings/settings-modal";
import { SidebarTodoWidget } from "@/components/layout/sidebar-left";
import { SidebarClock, SidebarTimer } from "@/components/layout/sidebar";
import { useMusic } from "@/context/music-context";
import { ThemePopover } from "@/components/theme/theme-popover";

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
    playTrackAt,
    loadUrl,
    setIsPickerOpen,
  } = useMusic();

  const handleLoad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    const success = loadUrl(inputUrl.trim());

    if (success) setInputUrl("");
  };

  const activeTodoCount = todos.filter((t) => !t.completed).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60) || 0;
    const s = Math.floor(secs % 60) || 0;

    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

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

      {/* Mobile Glance Drawer (HeroUI Drawer) */}
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
                      className="text-[10px] uppercase r font-bold text-foreground"
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
                  <div className="size-11 rounded-xl overflow-hidden bg-surface-secondary border border-separator/50 relative shrink-0">
                    {posterUrl ? (
                      <img
                        alt={title}
                        className="w-full h-full object-cover"
                        src={posterUrl}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/20 text-accent">
                        <Music className="size-4" />
                      </div>
                    )}
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1 gap-0.5">
                        <span className="w-0.5 h-3 bg-accent rounded-full animate-bounce" />
                        <span
                          className="w-0.5 h-2 bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-0.5 h-2.5 bg-accent rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Typography
                      truncate
                      className="text-xs sm:text-sm font-semibold text-foreground leading-tight"
                      type="body-sm"
                    >
                      {title}
                    </Typography>
                    <Typography
                      truncate
                      className="text-[11px] text-muted leading-tight mt-0.5"
                      type="body-xs"
                    >
                      {author}
                    </Typography>
                  </div>
                </div>

                {/* Scrubber Timeline */}
                <div className="flex flex-col gap-1 w-full">
                  <input
                    aria-label="Timeline scrubber"
                    className={`w-full h-1 rounded-full appearance-none outline-none ${
                      isLive
                        ? "pointer-events-none bg-accent"
                        : "cursor-pointer"
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

                      if (duration > 0) {
                        seekTo((val / 100) * duration, true);
                      }
                    }}
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted tabular-nums">
                    {isLive ? (
                      <span className="text-accent font-bold">● LIVE</span>
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
                      <Button
                        isIconOnly
                        aria-label="Previous track"
                        className="size-7 rounded-full text-muted hover:text-foreground"
                        size="sm"
                        variant="ghost"
                        onClick={prevTrack}
                      >
                        <SkipBack className="size-3.5 fill-current" />
                      </Button>
                    )}

                    <Button
                      isIconOnly
                      aria-label={isPlaying ? "Pause" : "Play"}
                      className="size-8 rounded-full bg-foreground text-background"
                      size="sm"
                      variant="primary"
                      onClick={togglePlay}
                    >
                      {isBuffering ? (
                        <Loader2 className="size-3.5 animate-spin text-background" />
                      ) : isPlaying ? (
                        <Pause className="size-3.5 fill-current" />
                      ) : (
                        <Play className="size-3.5 fill-current ml-0.5" />
                      )}
                    </Button>

                    {hasMultipleTracks && (
                      <Button
                        isIconOnly
                        aria-label="Next track"
                        className="size-7 rounded-full text-muted hover:text-foreground"
                        size="sm"
                        variant="ghost"
                        onClick={nextTrack}
                      >
                        <SkipForward className="size-3.5 fill-current" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      isIconOnly
                      aria-label="Toggle tracklist"
                      className={`size-7 rounded-md transition-[background-color,color] duration-150 ${
                        isDrawerTracklistOpen
                          ? "text-accent bg-accent/15"
                          : "text-muted hover:text-foreground"
                      }`}
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsDrawerTracklistOpen((prev) => !prev)}
                    >
                      <ListMusic className="size-4" />
                    </Button>

                    <div className="flex items-center gap-1.5 w-20">
                      <button
                        aria-label="Mute toggle"
                        className="text-muted hover:text-foreground cursor-pointer shrink-0"
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

                {/* Collapsible Tracklist Drawer in Mobile Widget with ScrollShadow */}
                {isDrawerTracklistOpen && (
                  <ScrollShadow className="max-h-32 p-1.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5 text-[11px] mt-1 overflow-y-auto no-scrollbar">
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

                {/* Stream URL Input Bar */}
                <form
                  className="flex items-center gap-1.5 pt-1"
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
                    Load
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
