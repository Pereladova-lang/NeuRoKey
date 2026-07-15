import { describe, it, expect } from "vitest";
import { nextLevel, pickSessionTypes, computeScores, nextStreak, earnedBadges } from "@/lib/engine";

describe("nextLevel", () => {
  const hi = { level: 2, accuracy: 0.9 };
  const lo = { level: 2, accuracy: 0.4 };
  it("levels up after three >80% in a row at current level", () =>
    expect(nextLevel([hi, hi, hi], 2)).toBe(3));
  it("does not level up after two", () => expect(nextLevel([hi, hi], 2)).toBe(2));
  it("levels down on <50%", () => expect(nextLevel([lo], 2)).toBe(1));
  it("clamps at 3 and 1", () => {
    expect(nextLevel([{ level: 3, accuracy: 1 }, { level: 3, accuracy: 1 }, { level: 3, accuracy: 1 }], 3)).toBe(3);
    expect(nextLevel([{ level: 1, accuracy: 0.1 }], 1)).toBe(1);
  });
});

describe("pickSessionTypes", () => {
  it("returns all three types once", () =>
    expect([...pickSessionTypes(null)].sort()).toEqual(["comic", "data", "robot"]));
  it("does not start with yesterday's first type", () =>
    expect(pickSessionTypes("comic")[0]).not.toBe("comic"));
});

describe("computeScores", () => {
  it("scales with accuracy and level", () => {
    const s = computeScores("robot", 2, 0.5);
    expect(s.control).toBe(3);   // 3 * 0.5 * 2
    expect(s.logic).toBe(2);     // 2 * 0.5 * 2
  });
});

describe("nextStreak", () => {
  const now = new Date("2026-07-15T10:00:00Z");
  it("increments when last session was yesterday", () =>
    expect(nextStreak(new Date("2026-07-14T18:00:00Z"), 4, now)).toBe(5));
  it("resets to 1 after a gap", () =>
    expect(nextStreak(new Date("2026-07-10T18:00:00Z"), 4, now)).toBe(1));
  it("keeps value if already today", () =>
    expect(nextStreak(new Date("2026-07-15T08:00:00Z"), 4, now)).toBe(4));
  it("starts at 1 for first session", () => expect(nextStreak(null, 0, now)).toBe(1));
});

describe("earnedBadges", () => {
  it("awards firstSession and streak badges", () => {
    expect(earnedBadges({ totalSessions: 1, streak: 1, maxLevel: 1 })).toContain("firstSession");
    expect(earnedBadges({ totalSessions: 5, streak: 3, maxLevel: 2 })).toEqual(
      expect.arrayContaining(["streak3", "level2"]),
    );
  });
});
