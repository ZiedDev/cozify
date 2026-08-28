import { Gamepad2, HelpCircle } from "lucide-react";

import { AchievementDefinition } from "./types";

export const SECRET_ACHIEVEMENTS: AchievementDefinition[] = [
  // Secret Konami Code Achievement
  {
    id: "konami_code",
    title: "Konami Code",
    description: "↑ ↑ ↓ ↓ ← → ← → B A — 30 Lives, Infinite Flow.",
    category: "secret",
    tier: "diamond",
    xp: 1337,
    icon: Gamepad2,
    isSecret: true,
    lockedTitle: "Classified Arcade Vault",
    lockedDescription:
      "A legendary sequence of 10 keystrokes unlocks infinite power.",
    lockedIcon: HelpCircle,
    maxProgress: 1,
    badgeColor: "text-pink-400",
    borderHighlight: "border-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.45)]",
    getValue: (m) => (m.isKonamiUnlocked ? 1 : 0),
  },
];
