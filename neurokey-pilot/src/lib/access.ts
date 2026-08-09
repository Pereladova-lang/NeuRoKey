export type Access = {
  allowed: boolean;
  reason: "ok" | "free_tier_limit" | "expired_soft";
  exercisesAllowed: 1 | 3;
};

export function checkAccess(
  sub: { status: string; trialEndsAt: Date },
  sessionsToday: number,
  now: Date,
): Access {
  const fullAccess =
    sub.status === "active" ||
    sub.status === "past_due" ||
    (sub.status === "trial" && sub.trialEndsAt.getTime() > now.getTime());
  if (fullAccess) return { allowed: true, reason: "ok", exercisesAllowed: 3 };
  if (sessionsToday >= 1) return { allowed: false, reason: "free_tier_limit", exercisesAllowed: 1 };
  return { allowed: true, reason: "ok", exercisesAllowed: 1 };
}
