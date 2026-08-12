import { describe, it, expect } from "vitest";
import { computeBaseline, updateProfile, scaleTrend } from "../src/cognitive-profile";
import type { SignalSource, CognitiveProfile } from "../src/cognitive-profile";

describe("computeBaseline", () => {
  it("averages readings per scale across sources", () => {
    const sources: SignalSource[] = [
      {
        kind: "in-app-interaction",
        readings: [
          { scaleId: "attention", value: 60 },
          { scaleId: "memory", value: 40 },
        ],
      },
      { kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] },
    ];
    const profile = computeBaseline("child-1", sources, new Date("2026-08-10T10:00:00Z"));
    expect(profile.userId).toBe("child-1");
    expect(profile.scales.attention).toBe(70);
    expect(profile.scales.memory).toBe(40);
    expect(profile.baselineCompletedAt).toEqual(new Date("2026-08-10T10:00:00Z"));
    expect(profile.lastAssessedAt).toEqual(new Date("2026-08-10T10:00:00Z"));
    expect(profile.history).toHaveLength(1);
  });

  it("produces an empty scales object with no readings", () => {
    const profile = computeBaseline("child-1", [], new Date("2026-08-10T10:00:00Z"));
    expect(profile.scales).toEqual({});
  });
});

describe("updateProfile", () => {
  it("blends new readings into the existing scale value", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"), // Monday
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] }],
      new Date("2026-08-04T10:00:00Z"), // Tuesday, same week
    );
    expect(updated.scales.attention).toBe(70);
    expect(updated.history).toHaveLength(1);
    expect(updated.lastAssessedAt).toEqual(new Date("2026-08-04T10:00:00Z"));
  });

  it("adds a scale that wasn't present before", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"),
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "memory", value: 50 }] }],
      new Date("2026-08-04T10:00:00Z"),
    );
    expect(updated.scales.memory).toBe(50);
    expect(updated.scales.attention).toBe(60);
  });

  it("appends a new week snapshot when the week changes", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"), // Monday
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] }],
      new Date("2026-08-10T10:00:00Z"), // next Monday
    );
    expect(updated.history).toHaveLength(2);
  });
});

describe("scaleTrend", () => {
  const baseProfile: CognitiveProfile = {
    userId: "child-1",
    scales: { attention: 70 },
    baselineCompletedAt: new Date("2026-08-03T10:00:00Z"),
    lastAssessedAt: new Date("2026-08-10T10:00:00Z"),
    history: [
      { weekStart: new Date("2026-08-03T00:00:00Z"), scales: { attention: 60 } },
      { weekStart: new Date("2026-08-10T00:00:00Z"), scales: { attention: 70 } },
    ],
  };

  it("returns the delta between the two most recent weeks", () => {
    expect(scaleTrend(baseProfile, "attention")).toBe(10);
  });

  it("returns 0 with fewer than two snapshots", () => {
    const profile: CognitiveProfile = { ...baseProfile, history: [baseProfile.history[0]] };
    expect(scaleTrend(profile, "attention")).toBe(0);
  });

  it("returns 0 for a scale with no data in the snapshots", () => {
    expect(scaleTrend(baseProfile, "memory")).toBe(0);
  });
});
