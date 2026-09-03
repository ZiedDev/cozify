import { AchievementDefinition } from "./types";
import { FOCUS_ACHIEVEMENTS } from "./focus";
import { CONSISTENCY_ACHIEVEMENTS } from "./consistency";
import { TASK_ACHIEVEMENTS } from "./tasks";
import { MASTERY_ACHIEVEMENTS } from "./mastery";
import { SECRET_ACHIEVEMENTS } from "./secret";

export * from "./types";
export * from "./categories";
export * from "./ranks";
export * from "./focus";
export * from "./consistency";
export * from "./tasks";
export * from "./mastery";
export * from "./secret";

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  ...FOCUS_ACHIEVEMENTS,
  ...CONSISTENCY_ACHIEVEMENTS,
  ...TASK_ACHIEVEMENTS,
  ...MASTERY_ACHIEVEMENTS,
  ...SECRET_ACHIEVEMENTS,
];
