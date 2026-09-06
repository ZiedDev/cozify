import {
  Button,
  Card,
  Separator,
  Slider,
  Surface,
  Typography,
} from "@heroui/react";
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
      <Surface variant="transparent">
        <Typography type="h4">General</Typography>
        <Typography color="muted" type="body-sm">
          Audio levels and system playback preferences.
        </Typography>
      </Surface>

      {/* Audio Volumes Card */}
      <Card>
        <Card.Content className="space-y-5">
          {/* Music Volume Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Music className="text-accent size-4" />
                <Typography type="h6">Music Volume</Typography>
              </Card.Title>
              <Card.Description>
                <Typography color="muted" type="body-sm">
                  Background music and audio stream playback level.
                </Typography>
              </Card.Description>
            </Card.Header>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onPress={toggleMusicMute}>
                {musicVolume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Slider
                aria-label="Music volume"
                className="w-full sm:w-32"
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
              <Typography className="w-[4ch]" color="muted" type="body-xs">
                {musicVolume}%
              </Typography>
            </div>
          </div>

          <Separator />

          {/* Sound Effects Volume Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Bell className="text-accent size-4" />
                <Typography type="h6">Sound Effects</Typography>
              </Card.Title>
              <Card.Description>
                <Typography color="muted" type="body-sm">
                  Volume for timer cues, notifications, and achievements.
                </Typography>
              </Card.Description>
            </Card.Header>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onPress={toggleSoundMute}>
                {soundVolume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Slider
                aria-label="Sound effects volume"
                className="w-full sm:w-32"
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
              <Typography className="w-[4ch]" color="muted" type="body-xs">
                {soundVolume}%
              </Typography>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
