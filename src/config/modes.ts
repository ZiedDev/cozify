import {
  Home,
  Timer as TimerIcon,
  ListTodo,
  Music,
  BarChart2,
  LucideIcon,
  Coffee,
} from "lucide-react";

export type AppMode = "home" | "pomodoro" | "cozy" | "todo" | "music" | "stats";

export interface DockItem {
  id: AppMode;
  label: string;
  icon: LucideIcon;
}

export const DOCK_ITEMS: readonly DockItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "cozy", label: "Cozy", icon: Coffee },
  { id: "pomodoro", label: "Pomodoro", icon: TimerIcon },
  { id: "todo", label: "To-Do", icon: ListTodo },
  { id: "music", label: "Music", icon: Music },
  { id: "stats", label: "Stats", icon: BarChart2 },
] as const;
