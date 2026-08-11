import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextSubscriptionState } from "@/lib/billing";

export async function POST() {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const next = nextSubscriptionState({ type: "cancel_requested" }, new Date());
  await db.subscription.update({ where: { parentId }, data: next });

  return NextResponse.json({ ok: true });
}
