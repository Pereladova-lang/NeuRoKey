import { describe, it, expect } from "vitest";
import { checkAccess } from "@/lib/access";

const now = new Date("2026-07-15T10:00:00Z");
const future = new Date("2026-07-18T10:00:00Z");
const past = new Date("2026-07-10T10:00:00Z");

describe("checkAccess", () => {
  it("trial not expired → full session", () =>
    expect(checkAccess({ status: "trial", trialEndsAt: future }, 5, now)).toEqual({
      allowed: true,
      reason: "ok",
      exercisesAllowed: 3,
    }));
  it("active → full", () =>
    expect(checkAccess({ status: "active", trialEndsAt: past }, 0, now).exercisesAllowed).toBe(3));
  it("past_due keeps access (grace)", () =>
    expect(checkAccess({ status: "past_due", trialEndsAt: past }, 0, now).allowed).toBe(true));
  it("expired trial → free tier one per day", () => {
    expect(checkAccess({ status: "trial", trialEndsAt: past }, 0, now)).toEqual({
      allowed: true,
      reason: "ok",
      exercisesAllowed: 1,
    });
    expect(checkAccess({ status: "trial", trialEndsAt: past }, 1, now)).toEqual({
      allowed: false,
      reason: "free_tier_limit",
      exercisesAllowed: 1,
    });
  });
  it("canceled → free tier", () =>
    expect(checkAccess({ status: "canceled", trialEndsAt: past }, 0, now).exercisesAllowed).toBe(1));
});
