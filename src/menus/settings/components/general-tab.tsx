import { Card, Slider, Typography } from "@heroui/react";
import { Volume2, VolumeX, Music, Bell } from "lucide-react";

import { useSound } from "@/hooks/use-sound";
import { useMusic } from "@/context/music-context";

export function GeneralTab() {
  const {
    volume: soundVolume,
    setVolume: setSoundVolume,
    toggleMute: toggleSoundMute,
  } = useSound();
  const {
    volume: musicVolume,
    setVolume: setMusicVolume,
    toggleMute: toggleMusicMute,
  } = useMusic();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Typography
          className="text-base text-foreground"
          type="h3"
          weight="semibold"
        >
          General
        </Typography>
        <Typography color="muted" type="body-sm">
          Audio levels and system playback preferences.
        </Typography>
      </div>

      {/* Audio Volumes Card */}
      <Card className="border border-border/50 bg-surface/40">
        <Card.Content className="space-y-4">
          {/* Music Volume Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-accent/10 text-accent mt-0.5 shrink-0">
                <Music className="size-4" />
              </div>
              <div>
                <Typography className="text-sm text-foreground" weight="medium">
                  Music Volume
                </Typography>
                <Typography className="text-xs" color="muted" type="body-xs">
                  Background music and audio stream playback level.
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
              <button
                aria-label={musicVolume === 0 ? "Unmute music" : "Mute music"}
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
                type="button"
                onClick={toggleMusicMute}
              >
                {musicVolume === 0 ? (
                  <VolumeX className="size-4 sm:size-4.5" />
                ) : (
                  <Volume2 className="size-4 sm:size-4.5" />
                )}
              </button>
              <Slider
                aria-label="Music volume"
                className="w-24 sm:w-32"
                maxValue={100}
                minValue={0}
                value={musicVolume}
                onChange={(val) => {
                  const num = typeof val === "number" ? val : val[0];

                  setMusicVolume(num);
                }}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <span className="text-xs text-muted font-mono w-8 text-right tabular-nums">
                {musicVolume}%
              </span>
            </div>
          </div>

          <div className="border-t border-separator/30" />

          {/* Sound Effects Volume Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-accent/10 text-accent mt-0.5 shrink-0">
                <Bell className="size-4" />
              </div>
              <div>
                <Typography className="text-sm text-foreground" weight="medium">
                  Sound Effects
                </Typography>
                <Typography className="text-xs" color="muted" type="body-xs">
                  Volume for timer cues, notifications, and achievements.
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
              <button
                aria-label={
                  soundVolume === 0
                    ? "Unmute sound effects"
                    : "Mute sound effects"
                }
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
                type="button"
                onClick={toggleSoundMute}
              >
                {soundVolume === 0 ? (
                  <VolumeX className="size-4 sm:size-4.5" />
                ) : (
                  <Volume2 className="size-4 sm:size-4.5" />
                )}
              </button>
              <Slider
                aria-label="Sound effects volume"
                className="w-24 sm:w-32"
                maxValue={100}
                minValue={0}
                value={soundVolume}
                onChange={(val) => {
                  const num = typeof val === "number" ? val : val[0];

                  setSoundVolume(num);
                }}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <span className="text-xs text-muted font-mono w-8 text-right tabular-nums">
                {soundVolume}%
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
