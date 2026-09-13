import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const Body = z.object({
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await db.feedback.create({ data: { parentId, message: parsed.data.message } });
  return NextResponse.json({ ok: true });
}
