export type TodoPriority = "none" | "low" | "medium" | "high";

export type TodoFilter = "all" | "today" | "active" | "completed";

export type TodoViewMode = "minimal" | "detailed";

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  priority?: TodoPriority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  tag?: string;
  notes?: string;
}

export interface TagOption {
  id: string;
  label: string;
  color: string;
}

export const PRESET_TAGS: readonly TagOption[] = [
  {
    id: "work",
    label: "Work",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "study",
    label: "Study",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "personal",
    label: "Personal",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "creative",
    label: "Creative",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
] as const;

export const PRIORITY_CONFIG: Record<
  TodoPriority,
  { label: string; color: string; dotColor: string; badgeClass: string }
> = {
  none: {
    label: "No Priority",
    color: "text-muted",
    dotColor: "bg-muted/40",
    badgeClass: "text-muted bg-surface-secondary/50 border-separator/40",
  },
  low: {
    label: "Low",
    color: "text-blue-400",
    dotColor: "bg-blue-400",
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    dotColor: "bg-amber-400",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  high: {
    label: "High",
    color: "text-danger",
    dotColor: "bg-danger",
    badgeClass: "text-danger bg-danger/10 border-danger/30",
  },
};
