import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getChildId } from "@/lib/child-session";
import { computeScores, type ExerciseType } from "@neurokey/core";

const Body = z.object({
  exerciseId: z.string().min(1),
  accuracy: z.number().min(0).max(1),
  durationSec: z.number().int().min(0),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const childId = getChildId(req);
  if (!childId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { exerciseId, accuracy, durationSec } = parsed.data;

  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.childId !== childId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const scores = computeScores(exercise.type as ExerciseType, exercise.level, accuracy);

  await db.sessionResult.create({
    data: {
      sessionId,
      exerciseId,
      accuracy,
      durationSec,
      scoresJson: JSON.stringify(scores),
    },
  });

  return NextResponse.json({ ok: true });
}
