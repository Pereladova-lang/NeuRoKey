import { db } from "@/lib/db";
import { nextLevel, type ExerciseType } from "@neurokey/core";

export async function lastFirstExerciseType(childId: string): Promise<ExerciseType | null> {
  const lastFinished = await db.session.findFirst({
    where: { childId, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
  });
  if (!lastFinished) return null;
  const ids = JSON.parse(lastFinished.exercisesJson) as string[];
  if (!ids.length) return null;
  const first = await db.exercise.findUnique({ where: { id: ids[0] } });
  return (first?.type as ExerciseType | undefined) ?? null;
}

export async function currentLevelFor(childId: string, type: ExerciseType): Promise<number> {
  const history = await db.sessionResult.findMany({
    where: { session: { childId }, exercise: { type } },
    orderBy: { createdAt: "asc" },
    include: { exercise: true },
  });
  const mapped = history.map((h) => ({ level: h.exercise.level, accuracy: h.accuracy }));
  const current = mapped.length ? mapped[mapped.length - 1].level : 1;
  return nextLevel(mapped, current);
}

export async function hydrateSession(session: { id: string; exercisesJson: string }) {
  const ids = JSON.parse(session.exercisesJson) as string[];
  const exercises = await db.exercise.findMany({ where: { id: { in: ids } } });
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return {
    sessionId: session.id,
    exercises: ids
      .map((id) => byId.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({ id: e.id, type: e.type, level: e.level, content: JSON.parse(e.contentJson) })),
  };
}
