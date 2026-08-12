import { describe, it, expect } from "vitest";
import { matchesTrigger, selectSkill, nextSkillVersion, reviseSkill } from "../src/skill";
import type { Skill } from "../src/skill";

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "post-shorts-attention",
    version: "1.0",
    name: "Compensation after short-form video",
    trigger: { signalType: "duration", minDurationMinutes: 20 },
    targetScales: ["attention"],
    exerciseParams: { typeWeights: { data: 2 }, difficultyAdjustment: 0 },
    authorship: [
      { name: "Author Name", qualification: "neuropsychologist", role: "methodologist", sharePercent: 100 },
    ],
    citations: [],
    createdAt: new Date("2026-08-01T00:00:00Z"),
    effectiveFrom: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

describe("matchesTrigger", () => {
  it("matches a duration trigger when the threshold is reached", () => {
    const skill = makeSkill();
    expect(matchesTrigger(skill, { durationMinutes: 25 })).toBe(true);
    expect(matchesTrigger(skill, { durationMinutes: 10 })).toBe(false);
  });

  it("matches a contentType trigger by membership", () => {
    const skill = makeSkill({ trigger: { signalType: "contentType", contentTypes: ["shorts", "tiktok"] } });
    expect(matchesTrigger(skill, { contentType: "tiktok" })).toBe(true);
    expect(matchesTrigger(skill, { contentType: "reading" })).toBe(false);
  });

  it("requires both conditions for a combined trigger", () => {
    const skill = makeSkill({
      trigger: { signalType: "combined", minDurationMinutes: 20, contentTypes: ["tiktok"] },
    });
    expect(matchesTrigger(skill, { durationMinutes: 25, contentType: "tiktok" })).toBe(true);
    expect(matchesTrigger(skill, { durationMinutes: 25, contentType: "reading" })).toBe(false);
    expect(matchesTrigger(skill, { durationMinutes: 5, contentType: "tiktok" })).toBe(false);
  });
});

describe("selectSkill", () => {
  it("returns the first matching skill in list order", () => {
    const skills = [
      makeSkill({ id: "a", trigger: { signalType: "duration", minDurationMinutes: 60 } }),
      makeSkill({ id: "b", trigger: { signalType: "duration", minDurationMinutes: 10 } }),
    ];
    expect(selectSkill(skills, { durationMinutes: 30 })?.id).toBe("b");
  });

  it("returns null when nothing matches", () => {
    const skills = [makeSkill({ trigger: { signalType: "duration", minDurationMinutes: 60 } })];
    expect(selectSkill(skills, { durationMinutes: 10 })).toBeNull();
  });
});

describe("nextSkillVersion", () => {
  it("increments the minor version", () => {
    expect(nextSkillVersion("1.0")).toBe("1.1");
    expect(nextSkillVersion("1.9")).toBe("1.10");
  });
});

describe("reviseSkill", () => {
  it("bumps the version and effectiveFrom while preserving authorship and id", () => {
    const skill = makeSkill();
    const revised = reviseSkill(
      skill,
      { targetScales: ["attention", "control"] },
      new Date("2026-09-01T00:00:00Z"),
    );
    expect(revised.version).toBe("1.1");
    expect(revised.targetScales).toEqual(["attention", "control"]);
    expect(revised.effectiveFrom).toEqual(new Date("2026-09-01T00:00:00Z"));
    expect(revised.authorship).toEqual(skill.authorship);
    expect(revised.id).toBe(skill.id);
    expect(revised.createdAt).toEqual(skill.createdAt);
  });
});
