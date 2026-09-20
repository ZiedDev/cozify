import { useEffect } from "react";

import { useSound } from "@/context/sound-context";
import { showAchievementToast } from "@/components/stats";
import { StatsRollupEngine } from "@/services/stats-rollup-engine";
import { TodoItem } from "@/menus/todo/types";
import {
  SessionRecord,
  STORAGE_KEYS,
  storageAdapter,
} from "@/services/storage";

const KNOWN_UNLOCKED_KEY = "cozify_known_unlocked_achievements";
const KONAMI_STORAGE_KEY = "cozify_konami_code";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function useAchievementTracker() {
  const { playSound } = useSound();

  useEffect(() => {
    const checkAndNotifyAchievements = () => {
      const sessions = storageAdapter.getItem<SessionRecord[]>(
        STORAGE_KEYS.SESSIONS_HISTORY,
        [],
      );
      const todos = storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, []);
      const currentMilestones = StatsRollupEngine.calculateMilestones(
        sessions,
        todos,
      );

      const knownRaw = localStorage.getItem(KNOWN_UNLOCKED_KEY);
      let knownSet: Set<string>;

      try {
        const parsed = knownRaw ? JSON.parse(knownRaw) : [];

        knownSet = new Set(Array.isArray(parsed) ? parsed : []);
      } catch {
        knownSet = new Set();
      }

      // Also merge any existing stored unlocked achievements
      try {
        const storedAchievementsRaw = localStorage.getItem(
          STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS,
        );

        if (storedAchievementsRaw) {
          const parsedStored = JSON.parse(storedAchievementsRaw);

          if (parsedStored && typeof parsedStored === "object") {
            Object.keys(parsedStored).forEach((id) => knownSet.add(id));
          }
        }
      } catch {}

      if (knownRaw === null) {
        // First run on browser: record currently unlocked without spamming toasts
        const initialUnlocked = currentMilestones
          .filter((milestone) => milestone.unlocked)
          .map((milestone) => milestone.id);

        initialUnlocked.forEach((id) => knownSet.add(id));

        localStorage.setItem(
          KNOWN_UNLOCKED_KEY,
          JSON.stringify(Array.from(knownSet)),
        );

        return;
      }

      let updated = false;

      currentMilestones.forEach((milestone) => {
        if (milestone.unlocked && !knownSet.has(milestone.id)) {
          showAchievementToast(milestone);
          playSound("achievement");
          knownSet.add(milestone.id);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(
          KNOWN_UNLOCKED_KEY,
          JSON.stringify(Array.from(knownSet)),
        );
      }
    };

    // Defer initial check on mount so it doesn't block First Contentful Paint
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => checkAndNotifyAchievements());
    } else {
      setTimeout(checkAndNotifyAchievements, 120);
    }

    // Global Konami Code sequence listener: ↑ ↑ ↓ ↓ ← → ← → B A
    const konamiBuffer: string[] = [];

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        konamiBuffer.length = 0;

        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      konamiBuffer.push(key);
      if (konamiBuffer.length > KONAMI_CODE.length) {
        konamiBuffer.shift();
      }

      const isMatch =
        konamiBuffer.length === KONAMI_CODE.length &&
        konamiBuffer.every(
          (bufferedKey, index) => bufferedKey === KONAMI_CODE[index],
        );

      if (isMatch) {
        event.preventDefault();
        konamiBuffer.length = 0;
        const alreadyUnlocked =
          localStorage.getItem(KONAMI_STORAGE_KEY) === "true";

        if (!alreadyUnlocked) {
          localStorage.setItem(KONAMI_STORAGE_KEY, "true");
          window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
          checkAndNotifyAchievements();
        }
      }
    };

    const handleStorageChange = () => {
      checkAndNotifyAchievements();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cozify_achievements_changed", handleStorageChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "cozify_achievements_changed",
        handleStorageChange,
      );
    };
  }, []);
}
