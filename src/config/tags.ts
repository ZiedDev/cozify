import type { LucideIcon } from "lucide-react";

import {
  BriefcaseBusiness,
  GraduationCap,
  Brush,
  User,
  Tag,
  Flag,
} from "lucide-react";

export type TodoPriority = "none" | "low" | "medium" | "high";

export type TagDefinition = {
  id: string;
  label: string;
  iconName: "briefcase-business" | "graduation-cap" | "brush" | "user" | "tag";
  color: string; // Default Tailwind classes for badge
  dotColor: string; // Tailwind class for dot indicator
  bgClass: string; // Tailwind background class
  borderClass: string; // Tailwind border class
  textClass: string; // Tailwind text color class
  chartFill: string; // Solid Tailwind class for charts/bars
};

export const PRESET_TAGS: readonly TagDefinition[] = [
  {
    id: "work",
    label: "Work",
    iconName: "briefcase-business",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dotColor: "text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
    chartFill: "bg-blue-400",
  },
  {
    id: "study",
    label: "Study",
    iconName: "graduation-cap",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    dotColor: "text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-400",
    chartFill: "bg-purple-400",
  },
  {
    id: "personal",
    label: "Personal",
    iconName: "user",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    dotColor: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    chartFill: "bg-emerald-400",
  },
  {
    id: "creative",
    label: "Creative",
    iconName: "brush",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    dotColor: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    chartFill: "bg-amber-400",
  },
] as const;

// Priority color schemes that override tag colors when priority is set
export const PRIORITY_THEMES: Record<
  TodoPriority,
  {
    label: string;
    badgeClass: string;
    dotColor: string;
    textColor: string;
  }
> = {
  none: {
    label: "No Priority",
    badgeClass: "text-muted/80 bg-surface-secondary/50 border-separator/30",
    dotColor: "bg-muted/40",
    textColor: "text-muted/80",
  },
  low: {
    label: "Low Priority",
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dotColor: "bg-blue-400",
    textColor: "text-blue-400",
  },
  medium: {
    label: "Medium Priority",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    dotColor: "bg-amber-400",
    textColor: "text-amber-400",
  },
  high: {
    label: "High Priority",
    badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    dotColor: "bg-rose-400",
    textColor: "text-rose-400",
  },
};

// Uniform color scheme for all custom or dynamic tags
export const CUSTOM_TAG_PALETTE: Omit<
  TagDefinition,
  "id" | "label" | "iconName"
> = {
  color: "text-accent bg-accent/10 border-accent/30",
  dotColor: "text-accent",
  bgClass: "bg-accent/10",
  borderClass: "border-accent/30",
  textClass: "text-accent",
  chartFill: "bg-accent",
};

/**
 * Returns the corresponding Lucide icon component for a tag
 */
export function getTagIcon(tagIdOrName?: string | null): LucideIcon {
  if (!tagIdOrName) return Tag;

  const normalized = tagIdOrName.trim().toLowerCase();

  switch (normalized) {
    case "work":
      return BriefcaseBusiness;
    case "study":
      return GraduationCap;
    case "creative":
      return Brush;
    case "personal":
      return User;
    default:
      return Tag;
  }
}

/**
 * Returns tag information with consistent colors for preset and custom tags.
 */
export function getTagInfo(tagIdOrName?: string | null): TagDefinition | null {
  if (!tagIdOrName) return null;

  const normalized = tagIdOrName.trim().toLowerCase();

  const preset = PRESET_TAGS.find(
    (presetTag) =>
      presetTag.id === normalized ||
      presetTag.label.toLowerCase() === normalized,
  );

  if (preset) return preset;

  // Capitalize tag name nicely
  const formattedLabel =
    tagIdOrName.charAt(0).toUpperCase() + tagIdOrName.slice(1);

  return {
    id: normalized,
    label: formattedLabel,
    iconName: "tag",
    ...CUSTOM_TAG_PALETTE,
  };
}

/**
 * Integrated Tag + Priority badge information:
 * - Priority sets/overrides the color palette when defined
 * - For "none" / no priority, the icon is colorless/neutral
 * - Tag provides the specific icon ("briefcase-business", "graduation-cap", "brush", "user")
 * - Hover tooltip presents complete priority & category context
 */
export function getIntegratedTagPriorityInfo(
  tagIdOrName?: string | null,
  priority: TodoPriority = "none",
): {
  badgeClass: string;
  dotColor: string;
  textColor: string;
  iconColor: string;
  tooltipText: string;
  label: string;
  Icon: LucideIcon;
  hasTag: boolean;
  hasPriority: boolean;
} {
  const tagMeta = getTagInfo(tagIdOrName);
  const hasTag = Boolean(tagMeta);
  const hasPriority = Boolean(priority && priority !== "none");
  const Icon = hasTag ? getTagIcon(tagIdOrName) : Flag;

  const priorityMeta = PRIORITY_THEMES[priority] || PRIORITY_THEMES.none;

  // Icon color: Colorless / neutral for no priority, priority colored otherwise
  let iconColor = "text-muted/60";

  if (priority === "high") {
    iconColor = "text-rose-400";
  } else if (priority === "medium") {
    iconColor = "text-amber-400";
  } else if (priority === "low") {
    iconColor = "text-blue-400";
  }

  // Priority color takes precedence for badge styling when set, otherwise neutral
  let badgeClass = "";
  let dotColor = "";
  let textColor = "";

  if (hasPriority) {
    badgeClass = priorityMeta.badgeClass;
    dotColor = priorityMeta.dotColor;
    textColor = priorityMeta.textColor;
  } else if (hasTag && tagMeta) {
    badgeClass = "text-muted/90 bg-surface-secondary/50 border-separator/30";
    dotColor = "bg-muted/40";
    textColor = "text-muted/90";
  } else {
    badgeClass = priorityMeta.badgeClass;
    dotColor = priorityMeta.dotColor;
    textColor = priorityMeta.textColor;
  }

  // Label to show inside badge
  const label = hasTag && tagMeta ? tagMeta.label : priorityMeta.label;

  // Rich tooltip text on hover
  let tooltipText = "";

  if (hasPriority && hasTag && tagMeta) {
    tooltipText = `${priorityMeta.label} • ${tagMeta.label}`;
  } else if (hasPriority) {
    tooltipText = priorityMeta.label;
  } else if (hasTag && tagMeta) {
    tooltipText = tagMeta.label;
  } else {
    tooltipText = "No Priority";
  }

  return {
    badgeClass,
    dotColor,
    textColor,
    iconColor,
    tooltipText,
    label,
    Icon,
    hasTag,
    hasPriority,
  };
}
