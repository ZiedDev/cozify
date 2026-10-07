import { describe, it, expect } from "vitest";

import {
  calculateNextCycle,
  determinePreferredBreak,
  countCompletedCycles,
  getNextFocusCycleAfterBreak,
  calculateCycleProgressPercent,
} from "./cycle-rules";

describe("Pomodoro Cycle Rules", () => {
  it("advances cycles up to target cycles and continues correctly", () => {
    expect(calculateNextCycle(1)).toBe(2);
    expect(calculateNextCycle(4)).toBe(5);
  });

  it("determines short vs long break based on cycle milestone", () => {
    // 4th cycle triggers a long break
    expect(determinePreferredBreak(1, 4)).toBe("shortBreak");
    expect(determinePreferredBreak(2, 4)).toBe("shortBreak");
    expect(determinePreferredBreak(3, 4)).toBe("shortBreak");
    expect(determinePreferredBreak(4, 4)).toBe("longBreak");
  });

  it("counts completed cycles accurately", () => {
    const states = {
      1: { timeLeft: 0, isCompleted: true },
      2: { timeLeft: 0, isCompleted: true },
      3: { timeLeft: 120, isCompleted: false },
    };

    expect(countCompletedCycles(states, 3, "focus", 120, 1500)).toBe(2);
  });

  it("determines next focus cycle after break", () => {
    const states = {
      1: { timeLeft: 0, isCompleted: true },
    };

    expect(getNextFocusCycleAfterBreak(1, 4, states)).toBe(2);
  });

  it("calculates cycle progress percentage correctly", () => {
    expect(calculateCycleProgressPercent("focus", 750, 1500)).toBe(50);
    expect(calculateCycleProgressPercent("focus", 0, 1500)).toBe(100);
    expect(calculateCycleProgressPercent("focus", 1500, 1500)).toBe(0);
  });
});
