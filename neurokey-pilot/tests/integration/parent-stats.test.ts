import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { auth } = await import("@/lib/auth");
const { GET } = await import("@/app/api/parent/stats/route");

async function seedParentWithHistory() {
  const email = `parent${Date.now()}@test.ru`;
  const parent = await db.parent.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("secret123", 10),
      subscription: { create: { trialEndsAt: new Date(Date.now() + 3 * 864e5) } },
      children: { create: { name: "Ваня", age: 12, pin: "1234" } },
    },
    include: { children: true },
  });
  const child = parent.children[0];
  const exercise = await db.exercise.findFirstOrThrow({ where: { type: "comic", level: 1 } });

  for (let i = 0; i < 2; i++) {
    const session = await db.session.create({
      data: {
        childId: child.id,
        exercisesJson: JSON.stringify([exercise.id]),
        finishedAt: new Date(),
      },
    });
    await db.sessionResult.create({
      data: {
        sessionId: session.id,
        exerciseId: exercise.id,
        accuracy: 1,
        durationSec: 20,
        scoresJson: JSON.stringify({ attention: 1, memory: 2, logic: 3, control: 1 }),
      },
    });
  }

  return { parent, child };
}

describe("GET /api/parent/stats", () => {
  it("returns weekly stats for the signed-in parent's children", async () => {
    const { parent, child } = await seedParentWithHistory();
    vi.mocked(auth).mockResolvedValue({ user: { parentId: parent.id, email: parent.email } } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.children).toHaveLength(1);
    expect(body.children[0].id).toBe(child.id);
    expect(body.children[0].sessionsThisWeek).toBe(2);
    expect(body.children[0].scales.current.logic).toBeGreaterThan(0);
    expect(body.subscription.status).toBe("trial");
  });

  it("returns 401 without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
