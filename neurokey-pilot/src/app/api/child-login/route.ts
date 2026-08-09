import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { childCookie } from "@/lib/child-session";

const Body = z.object({
  childId: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { childId, pin } = parsed.data;

  const child = await db.child.findUnique({ where: { id: childId } });
  if (!child || child.pin !== pin) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", childCookie(child.id));
  return res;
}
