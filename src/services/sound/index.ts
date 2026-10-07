export const SOUNDS = {
  pomoStart: "./sounds/pomo-start.wav",
  pomoPause: "./sounds/pomo-pause.wav",
  pomoEnd: "./sounds/pomo-end.wav",
  notification: "./sounds/notification.wav",
  achievement: "./sounds/achievement.wav",
  taskComplete: "./sounds/task-complete.wav",
} as const;

export type SoundEffect = keyof typeof SOUNDS;

/**
 * Converts a linear slider value (0-100) to actual audio volume (0.0-1.0) using
 * a quadratic/logarithmic curve matching human hearing perception.
 */
export function toActualVolume(sliderVal: number): number {
  if (sliderVal <= 0) return 0;
  if (sliderVal >= 100) return 1;

  return Math.pow(sliderVal / 100, 2);
}

const audioCache = new Map<SoundEffect, HTMLAudioElement>();

/**
 * Play a local sound effect using cached audio elements. Fails silently if the file hasn't been added yet.
 */
export function playAudio(sound: SoundEffect, volumePercent: number) {
  if (volumePercent <= 0 || typeof window === "undefined") return;

  const src = SOUNDS[sound];

  if (!src) return;

  try {
    let audio = audioCache.get(sound);

    if (!audio) {
      audio = new Audio(src);
      audioCache.set(sound, audio);
    }

    audio.volume = Math.max(0, Math.min(1, toActualVolume(volumePercent)));

    if (!audio.paused) {
      audio.currentTime = 0;
    }

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  } catch {}
}
