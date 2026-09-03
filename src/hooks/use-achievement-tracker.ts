import { useEffect } from "react";

import { showAchievementToast } from "@/menus/stats/components/achievement-toast";
import {
  calculateMilestones,
  calculateOverallStats,
} from "@/menus/stats/logic/stats-calculator";
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
  useEffect(() => {
    const checkAndNotifyAchievements = () => {
      const sessions = storageAdapter.getItem<SessionRecord[]>(
        STORAGE_KEYS.SESSIONS_HISTORY,
        [],
      );
      const todos = storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, []);
      const overall = calculateOverallStats(sessions, todos);
      const currentMilestones = calculateMilestones(sessions, todos, overall);

      const knownRaw = localStorage.getItem(KNOWN_UNLOCKED_KEY);
      let knownSet: Set<string>;

      if (knownRaw === null) {
        // First run on browser: record currently unlocked without spamming
        const initialUnlocked = currentMilestones
          .filter((m) => m.unlocked)
          .map((m) => m.id);

        localStorage.setItem(
          KNOWN_UNLOCKED_KEY,
          JSON.stringify(initialUnlocked),
        );

        return;
      }

      try {
        knownSet = new Set(JSON.parse(knownRaw));
      } catch {
        knownSet = new Set();
      }

      let updated = false;

      currentMilestones.forEach((m) => {
        if (m.unlocked && !knownSet.has(m.id)) {
          showAchievementToast(m);
          knownSet.add(m.id);
          updated = true;
        } else if (!m.unlocked && knownSet.has(m.id)) {
          knownSet.delete(m.id);
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

    // Check on mount
    checkAndNotifyAchievements();

    // Global Konami Code sequence listener: ↑ ↑ ↓ ↓ ← → ← → B A
    const konamiBuffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        konamiBuffer.length = 0;

        return;
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      konamiBuffer.push(key);
      if (konamiBuffer.length > KONAMI_CODE.length) {
        konamiBuffer.shift();
      }

      const isMatch =
        konamiBuffer.length === KONAMI_CODE.length &&
        konamiBuffer.every((k, idx) => k === KONAMI_CODE[idx]);

      if (isMatch) {
        e.preventDefault();
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
