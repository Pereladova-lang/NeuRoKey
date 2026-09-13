import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { auth } = await import("@/lib/auth");
const { POST } = await import("@/app/api/error-report/route");

const json = (body: unknown) =>
  new Request("http://test", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

describe("POST /api/error-report", () => {
  it("stores a client error without requiring a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(json({ message: "boom", stack: "at x", path: "/child/session" }));
    expect(res.status).toBe(200);

    const stored = await db.errorLog.findFirst({ where: { message: "boom" }, orderBy: { createdAt: "desc" } });
    expect(stored?.source).toBe("client");
    expect(stored?.path).toBe("/child/session");
    expect(stored?.parentId).toBeNull();
  });

  it("attaches the parentId when a parent session exists", async () => {
    const parent = await db.parent.create({
      data: { email: `err${Date.now()}@test.ru`, passwordHash: await bcrypt.hash("secret123", 10), consentAt: new Date() },
    });
    vi.mocked(auth).mockResolvedValue({ user: { parentId: parent.id, email: parent.email } } as never);

    await POST(json({ message: "boom with parent" }));
    const stored = await db.errorLog.findFirst({ where: { message: "boom with parent" } });
    expect(stored?.parentId).toBe(parent.id);
  });

  it("rejects an empty message", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(json({ message: "" }));
    expect(res.status).toBe(400);
  });
});
