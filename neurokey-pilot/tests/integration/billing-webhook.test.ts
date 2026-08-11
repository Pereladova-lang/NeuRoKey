import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { POST as webhook } from "@/app/api/billing/webhook/route";

const PASSWORD2 = "test-password-2";

function md5(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

function formRequest(body: Record<string, string>) {
  return new Request("http://test/api/billing/webhook", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
}

async function seedParent() {
  const email = `billing${Date.now()}@test.ru`;
  const parent = await db.parent.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("secret123", 10),
      subscription: { create: { status: "trial", trialEndsAt: new Date(Date.now() + 3 * 864e5) } },
    },
    include: { subscription: true },
  });
  return parent;
}

describe("POST /api/billing/webhook", () => {
  const prevPassword2 = process.env.ROBOKASSA_PASSWORD2;
  beforeAll(() => {
    process.env.ROBOKASSA_PASSWORD2 = PASSWORD2;
  });
  afterAll(() => {
    process.env.ROBOKASSA_PASSWORD2 = prevPassword2;
  });

  it("activates the subscription on a validly signed callback", async () => {
    const parent = await seedParent();
    const outSum = "299.00";
    const invId = "12345";
    const sig = md5(`${outSum}:${invId}:${PASSWORD2}:Shp_parentId=${parent.id}`);

    const res = await webhook(
      formRequest({ OutSum: outSum, InvId: invId, SignatureValue: sig, Shp_parentId: parent.id }),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(`OK${invId}`);

    const sub = await db.subscription.findUnique({ where: { parentId: parent.id } });
    expect(sub?.status).toBe("active");
    expect(sub?.paymentMethodId).toBe(invId);
  });

  it("rejects an invalid signature without activating anything, still returns 200", async () => {
    const parent = await seedParent();

    const res = await webhook(
      formRequest({ OutSum: "299.00", InvId: "1", SignatureValue: "bogus", Shp_parentId: parent.id }),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^FAIL/);

    const sub = await db.subscription.findUnique({ where: { parentId: parent.id } });
    expect(sub?.status).toBe("trial");
  });

  it("rejects a payload missing required fields, still returns 200", async () => {
    const res = await webhook(formRequest({ OutSum: "299.00" }));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^FAIL/);
  });
});
