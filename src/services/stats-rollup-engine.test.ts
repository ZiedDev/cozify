import { describe, it, expect } from "vitest";

import {
  toDateString,
  createEmptyDailyRollup,
  createEmptyAllTimeSummary,
} from "./stats-rollup-engine";

describe("Stats Rollup Engine", () => {
  it("formats date into local YYYY-MM-DD string", () => {
    const fixedDate = new Date(2026, 9, 7); // Oct 7, 2026

    expect(toDateString(fixedDate)).toBe("2026-10-07");
  });

  it("creates initialized empty daily rollup", () => {
    const rollup = createEmptyDailyRollup("2026-10-07");

    expect(rollup.date).toBe("2026-10-07");
    expect(rollup.focusMinutes).toBe(0);
    expect(rollup.sessionCount).toBe(0);
    expect(rollup.tasksCompletedCount).toBe(0);
  });

  it("creates empty all-time summary", () => {
    const summary = createEmptyAllTimeSummary();

    expect(summary.totalFocusMinutes).toBe(0);
    expect(summary.totalSessions).toBe(0);
    expect(summary.bestStreakDays).toBe(0);
  });
});
