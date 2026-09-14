import {
  TagDefinition,
  TodoPriority,
  PRESET_TAGS,
  PRIORITY_THEMES,
  getTagInfo,
  getTagIcon,
  getIntegratedTagPriorityInfo,
} from "@/config/tags";

export type { TagDefinition, TodoPriority };
export {
  PRESET_TAGS,
  PRIORITY_THEMES,
  getTagInfo,
  getTagIcon,
  getIntegratedTagPriorityInfo,
};

export type TodoFilter = "all" | "today" | "active" | "completed";

export type TodoViewMode = "minimal" | "detailed";

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  priority?: TodoPriority;
  dueDate?: string; // YYYY-MM-DD
  tag?: string;
  notes?: string;
  archived?: boolean;
  archivedAt?: number;
  isDeleted?: boolean;
  updatedAt?: number;
  version?: number;
};

export type TagOption = TagDefinition;

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
    color: "text-rose-400",
    dotColor: "bg-rose-400",
    badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
};
