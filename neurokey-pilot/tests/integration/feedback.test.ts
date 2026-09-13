import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const { auth } = await import("@/lib/auth");
const { POST } = await import("@/app/api/feedback/route");

const json = (body: unknown) =>
  new Request("http://test", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

async function seedParent() {
  return db.parent.create({
    data: { email: `fb${Date.now()}@test.ru`, passwordHash: await bcrypt.hash("secret123", 10), consentAt: new Date() },
  });
}

describe("POST /api/feedback", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(json({ message: "hi" }));
    expect(res.status).toBe(401);
  });

  it("stores feedback for the logged-in parent", async () => {
    const parent = await seedParent();
    vi.mocked(auth).mockResolvedValue({ user: { parentId: parent.id, email: parent.email } } as never);

    const res = await POST(json({ message: "Ребёнку нравится, но робот иногда виснет" }));
    expect(res.status).toBe(200);

    const stored = await db.feedback.findFirst({ where: { parentId: parent.id } });
    expect(stored?.message).toBe("Ребёнку нравится, но робот иногда виснет");
  });

  it("rejects an empty message", async () => {
    const parent = await seedParent();
    vi.mocked(auth).mockResolvedValue({ user: { parentId: parent.id, email: parent.email } } as never);
    const res = await POST(json({ message: "" }));
    expect(res.status).toBe(400);
  });
});
