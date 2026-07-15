import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("schema", () => {
  it("creates parent with trial subscription and child", async () => {
    const parent = await db.parent.create({
      data: {
        email: `t${Date.now()}@test.ru`,
        passwordHash: "x",
        subscription: {
          create: { trialEndsAt: new Date(Date.now() + 3 * 864e5) },
        },
        children: { create: { name: "Маша", age: 12, pin: "1234" } },
      },
      include: { subscription: true, children: true },
    });
    expect(parent.subscription?.status).toBe("trial");
    expect(parent.children[0].mascotLevel).toBe(1);
  });
});
