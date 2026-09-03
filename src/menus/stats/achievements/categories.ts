import { Crown, Flame, Gem, Layers, Trophy, Zap } from "lucide-react";

export const ACHIEVEMENT_CATEGORY_TABS = [
  { id: "all", label: "All", icon: Trophy },
  { id: "focus", label: "Focus", icon: Zap },
  { id: "consistency", label: "Streaks", icon: Flame },
  { id: "tasks", label: "Tasks", icon: Layers },
  { id: "mastery", label: "Mastery", icon: Crown },
  { id: "secret", label: "Secret", icon: Gem },
] as const;
