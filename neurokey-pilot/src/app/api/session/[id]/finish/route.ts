import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getChildId } from "@/lib/child-session";
import { nextStreak, earnedBadges, type ExerciseType } from "@/lib/engine";
import { TYPE_LABELS } from "@/lib/type-labels";

const Body = z.object({
  feedbackEmoji: z.enum(["love", "good", "meh", "bad"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const childId = getChildId(req);
  if (!childId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.childId !== childId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const child = await db.child.findUnique({ where: { id: childId } });
  if (!child) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date();
  await db.session.update({
    where: { id: sessionId },
    data: { finishedAt: now, feedbackEmoji: parsed.data.feedbackEmoji },
  });

  const totalSessions = await db.session.count({ where: { childId, finishedAt: { not: null } } });
  const streak = nextStreak(child.lastSessionAt, child.streak, now);
  const mascotLevel = Math.min(5, 1 + Math.floor(totalSessions / 5));

  const levels = await db.sessionResult.findMany({
    where: { session: { childId } },
    include: { exercise: true },
  });
  const maxLevel = levels.reduce((max, r) => Math.max(max, r.exercise.level), 1);

  const existing = await db.achievement.findMany({ where: { childId } });
  const existingKeys = new Set(existing.map((a) => a.badgeKey));
  const badges = earnedBadges({ totalSessions, streak, maxLevel });
  const newBadges = badges.filter((b) => !existingKeys.has(b));

  if (newBadges.length) {
    await db.achievement.createMany({
      data: newBadges.map((badgeKey) => ({ childId, badgeKey })),
    });
  }

  await db.child.update({
    where: { id: childId },
    data: { streak, lastSessionAt: now, mascotLevel },
  });

  const ids = JSON.parse(session.exercisesJson) as string[];
  const exercises = await db.exercise.findMany({ where: { id: { in: ids } } });
  const summary = Array.from(new Set(exercises.map((e) => TYPE_LABELS[e.type as ExerciseType])));

  return NextResponse.json({ streak, mascotLevel, newBadges, summary });
}
