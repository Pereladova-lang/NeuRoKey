import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getChildId } from "@/lib/child-session";
import { checkAccess } from "@/lib/access";
import { pickSessionTypes, type ExerciseType } from "@/lib/engine";
import { lastFirstExerciseType, currentLevelFor, hydrateSession } from "@/lib/session-service";

const OPEN_SESSION_TTL_MS = 3600_000;

export async function POST(req: Request) {
  const childId = getChildId(req);
  if (!childId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const child = await db.child.findUnique({
    where: { id: childId },
    include: { parent: { include: { subscription: true } } },
  });
  if (!child?.parent.subscription) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sessionsToday = await db.session.count({
    where: { childId, startedAt: { gte: todayStart }, finishedAt: { not: null } },
  });

  const access = checkAccess(child.parent.subscription, sessionsToday, now);
  if (!access.allowed) return NextResponse.json({ reason: access.reason }, { status: 403 });

  const open = await db.session.findFirst({ where: { childId, finishedAt: null } });
  if (open && now.getTime() - open.startedAt.getTime() < OPEN_SESSION_TTL_MS) {
    return NextResponse.json(await hydrateSession(open));
  }
  if (open) {
    await db.session.update({ where: { id: open.id }, data: { finishedAt: now } });
  }

  const lastFirst = await lastFirstExerciseType(childId);
  const types = pickSessionTypes(lastFirst).slice(0, access.exercisesAllowed) as ExerciseType[];

  const exercises = await Promise.all(
    types.map(async (type) => {
      const level = await currentLevelFor(childId, type);
      const pool = await db.exercise.findMany({ where: { type, level } });
      return pool[Math.floor(Math.random() * pool.length)];
    }),
  );

  const session = await db.session.create({
    data: { childId, exercisesJson: JSON.stringify(exercises.map((e) => e.id)) },
  });

  return NextResponse.json({
    sessionId: session.id,
    exercises: exercises.map((e) => ({ id: e.id, type: e.type, level: e.level, content: JSON.parse(e.contentJson) })),
  });
}
