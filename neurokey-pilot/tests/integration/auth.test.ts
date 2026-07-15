import { describe, it, expect } from "vitest";
import { POST as register } from "@/app/api/register/route";
import { POST as childLogin } from "@/app/api/child-login/route";
import { db } from "@/lib/db";

const json = (body: unknown) =>
  new Request("http://test", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

describe("registration", () => {
  it("creates parent, child and trial subscription", async () => {
    const email = `p${Date.now()}@test.ru`;
    const res = await register(json({ email, password: "secret123", childName: "Ваня", childAge: 12, childPin: "4321" }));
    expect(res.status).toBe(200);
    const parent = await db.parent.findUnique({ where: { email }, include: { subscription: true, children: true } });
    expect(parent?.subscription?.status).toBe("trial");
    expect(parent?.subscription?.trialEndsAt.getTime()).toBeGreaterThan(Date.now());
    expect(parent?.children[0].name).toBe("Ваня");
  });
  it("rejects duplicate email with 409", async () => {
    const email = `dup${Date.now()}@test.ru`;
    await register(json({ email, password: "secret123", childName: "А", childAge: 11, childPin: "0000" }));
    const res = await register(json({ email, password: "secret123", childName: "Б", childAge: 11, childPin: "0000" }));
    expect(res.status).toBe(409);
  });
});

describe("child login", () => {
  it("sets cookie on correct pin, 401 on wrong", async () => {
    const email = `c${Date.now()}@test.ru`;
    await register(json({ email, password: "secret123", childName: "Оля", childAge: 13, childPin: "7777" }));
    const child = (await db.parent.findUnique({ where: { email }, include: { children: true } }))!.children[0];
    const ok = await childLogin(json({ childId: child.id, pin: "7777" }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toContain("nk_child=");
    const bad = await childLogin(json({ childId: child.id, pin: "0000" }));
    expect(bad.status).toBe(401);
  });
});
