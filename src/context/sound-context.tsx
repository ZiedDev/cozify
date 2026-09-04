import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";

import { SoundEffect, playAudio } from "@/services/sound";
import { storageAdapter } from "@/services/storage";

const SOUND_STORAGE_KEY = "cozify_sound_volume";

type SoundContextValue = {
  volume: number;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playSound: (sound: SoundEffect) => void;
};

export const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [volume, setVolumeState] = useState<number>(() =>
    storageAdapter.getItem<number>(SOUND_STORAGE_KEY, 80),
  );

  const volumeRef = useRef(volume);
  const lastNonZeroRef = useRef(volume > 0 ? volume : 80);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    volumeRef.current = volume;
    if (volume > 0) lastNonZeroRef.current = volume;
  }, [volume]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));

    volumeRef.current = clamped;
    setVolumeState(clamped);

    // Debounce localStorage write so dragging the slider remains silky 60fps
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      storageAdapter.setItem(SOUND_STORAGE_KEY, clamped);
      saveTimerRef.current = null;
    }, 150);
  }, []);

  const toggleMute = useCallback(() => {
    if (volumeRef.current > 0) {
      lastNonZeroRef.current = volumeRef.current;
      setVolume(0);
    } else {
      setVolume(lastNonZeroRef.current || 80);
    }
  }, [setVolume]);

  // Stable playSound callback using volumeRef so consumers (TodoProvider, TimerProvider, etc.) never re-render when volume changes
  const playSound = useCallback((sound: SoundEffect) => {
    playAudio(sound, volumeRef.current);
  }, []);

  const value = useMemo(
    () => ({ volume, setVolume, toggleMute, playSound }),
    [volume, setVolume, toggleMute, playSound],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);

  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }

  return context;
}
