import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const Body = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  path: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await auth();
  await db.errorLog.create({
    data: { source: "client", parentId: session?.user?.parentId, ...parsed.data },
  });

  return NextResponse.json({ ok: true });
}
