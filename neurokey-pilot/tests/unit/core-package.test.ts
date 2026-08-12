import { describe, it, expect } from "vitest";
import { nextLevel, computeBaseline, selectSkill } from "@neurokey/core";
import type { Skill } from "@neurokey/core";

describe("@neurokey/core package wiring", () => {
  it("exposes the engine API to the pilot app", () => {
    expect(nextLevel([], 2)).toBe(2);
  });

  it("exposes the cognitive profile API to the pilot app", () => {
    const profile = computeBaseline("child-1", [], new Date("2026-08-10T00:00:00Z"));
    expect(profile.userId).toBe("child-1");
  });

  it("exposes the skill API to the pilot app", () => {
    const skills: Skill[] = [];
    expect(selectSkill(skills, {})).toBeNull();
  });
});
