import { describe, it, expect } from "vitest";
import { POST as register } from "@/app/api/register/route";
import { POST as childLogin } from "@/app/api/child-login/route";
import { POST as startSession } from "@/app/api/session/start/route";
import { POST as submitResult } from "@/app/api/session/[id]/submit/route";
import { POST as finishSession } from "@/app/api/session/[id]/finish/route";
import { db } from "@/lib/db";

const json = (body: unknown, cookie?: string) =>
  new Request("http://test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });

async function registerAndLoginChild(overrides: { email: string; childName: string; childPin: string }) {
  await register(
    json({
      email: overrides.email,
      password: "secret123",
      childName: overrides.childName,
      childAge: 12,
      childPin: overrides.childPin,
    }),
  );
  const parent = await db.parent.findUnique({ where: { email: overrides.email }, include: { children: true } });
  const child = parent!.children[0];
  const loginRes = await childLogin(json({ childId: child.id, pin: overrides.childPin }));
  const setCookie = loginRes.headers.get("set-cookie")!;
  const cookie = setCookie.split(";")[0];
  return { child, cookie };
}

describe("session lifecycle", () => {
  it("full cycle: start -> 3x submit -> finish", async () => {
    const email = `s${Date.now()}@test.ru`;
    const { child, cookie } = await registerAndLoginChild({ email, childName: "Ваня", childPin: "1234" });

    const startRes = await startSession(json({}, cookie));
    expect(startRes.status).toBe(200);
    const { sessionId, exercises } = await startRes.json();
    expect(exercises).toHaveLength(3);

    for (const ex of exercises) {
      const res = await submitResult(json({ exerciseId: ex.id, accuracy: 1, durationSec: 30 }, cookie), {
        params: Promise.resolve({ id: sessionId }),
      });
      expect(res.status).toBe(200);
    }

    const results = await db.sessionResult.findMany({ where: { sessionId } });
    expect(results).toHaveLength(3);

    const finishRes = await finishSession(json({ feedbackEmoji: "love" }, cookie), {
      params: Promise.resolve({ id: sessionId }),
    });
    expect(finishRes.status).toBe(200);
    const summary = await finishRes.json();
    expect(summary.streak).toBe(1);
    expect(summary.newBadges).toContain("firstSession");

    const updatedChild = await db.child.findUnique({ where: { id: child.id } });
    expect(updatedChild?.streak).toBe(1);
  });

  it("blocks a second session the same day once subscription has no full access", async () => {
    const email = `f${Date.now()}@test.ru`;
    const { child, cookie } = await registerAndLoginChild({ email, childName: "Оля", childPin: "5678" });

    await db.subscription.update({ where: { parentId: child.parentId }, data: { status: "canceled" } });

    const first = await startSession(json({}, cookie));
    expect(first.status).toBe(200);
    const { sessionId, exercises } = await first.json();
    for (const ex of exercises) {
      await submitResult(json({ exerciseId: ex.id, accuracy: 1, durationSec: 30 }, cookie), {
        params: Promise.resolve({ id: sessionId }),
      });
    }
    await finishSession(json({ feedbackEmoji: "good" }, cookie), { params: Promise.resolve({ id: sessionId }) });

    const second = await startSession(json({}, cookie));
    expect(second.status).toBe(403);
    const body = await second.json();
    expect(body.reason).toBe("free_tier_limit");
  });
});
