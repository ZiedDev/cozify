import { Gamepad2, HelpCircle } from "lucide-react";

import { AchievementDefinition } from "./types";

export const SECRET_ACHIEVEMENTS: AchievementDefinition[] = [
  // Secret Konami Code Achievement
  {
    id: "konami_code",
    title: "Konami Code",
    description:
      "Cheat code activated. You are now officially winning at wasting time.",
    category: "secret",
    tier: "diamond",
    xp: 3000,
    icon: Gamepad2,
    isSecret: true,
    lockedTitle: "Secrete achievement",
    lockedDescription: "Input sequence pending.",
    lockedIcon: HelpCircle,
    maxProgress: 1,
    badgeColor: "text-pink-400",
    borderHighlight: "border-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.45)]",
    getValue: (metrics) => (metrics.isKonamiUnlocked ? 1 : 0),
  },
];
