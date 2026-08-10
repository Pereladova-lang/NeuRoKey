import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getParentStats } from "@/lib/parent-stats";

export async function GET() {
  const session = await auth();
  const parentId = session?.user?.parentId;
  if (!parentId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stats = await getParentStats(parentId);
  if (!stats) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json(stats);
}
