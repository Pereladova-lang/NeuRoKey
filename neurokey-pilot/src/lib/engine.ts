import type { CognitiveScores } from "@/lib/exercise-types";

export type ExerciseType = "comic" | "data" | "robot";

const TYPE_WEIGHTS: Record<ExerciseType, CognitiveScores> = {
  comic: { attention: 1, memory: 2, logic: 3, control: 1 },
  data: { attention: 2, memory: 1, logic: 3, control: 2 },
  robot: { attention: 2, memory: 2, logic: 2, control: 3 },
};

export function nextLevel(history: { level: number; accuracy: number }[], current: number): number {
  const last = history[history.length - 1];
  if (last && last.accuracy < 0.5) return Math.max(1, current - 1);
  const recent = history.slice(-3);
  if (recent.length === 3 && recent.every((h) => h.level === current && h.accuracy > 0.8))
    return Math.min(3, current + 1);
  return current;
}

export function pickSessionTypes(lastFirstType: ExerciseType | null): [ExerciseType, ExerciseType, ExerciseType] {
  const all: ExerciseType[] = ["comic", "data", "robot"];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  if (lastFirstType && shuffled[0] === lastFirstType) {
    const j = 1 + Math.floor(Math.random() * 2);
    [shuffled[0], shuffled[j]] = [shuffled[j], shuffled[0]];
  }
  return shuffled as [ExerciseType, ExerciseType, ExerciseType];
}

export function computeScores(type: ExerciseType, level: number, accuracy: number): CognitiveScores {
  const w = TYPE_WEIGHTS[type];
  const f = (x: number) => Math.round(x * accuracy * level * 100) / 100;
  return { attention: f(w.attention), memory: f(w.memory), logic: f(w.logic), control: f(w.control) };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function nextStreak(lastSessionAt: Date | null, streak: number, now: Date): number {
  if (!lastSessionAt) return 1;
  if (dayKey(lastSessionAt) === dayKey(now)) return streak;
  const yesterday = new Date(now.getTime() - 864e5);
  return dayKey(lastSessionAt) === dayKey(yesterday) ? streak + 1 : 1;
}

export function earnedBadges(input: { totalSessions: number; streak: number; maxLevel: number }): string[] {
  const out: string[] = [];
  if (input.totalSessions >= 1) out.push("firstSession");
  if (input.totalSessions >= 10) out.push("sessions10");
  if (input.streak >= 3) out.push("streak3");
  if (input.streak >= 7) out.push("streak7");
  if (input.maxLevel >= 2) out.push("level2");
  if (input.maxLevel >= 3) out.push("level3");
  return out;
}

export function aggregateWeek(
  results: { scoresJson: string; createdAt: Date }[],
  now: Date,
): { current: CognitiveScores; delta: CognitiveScores } {
  const week = 7 * 864e5;
  const zero: CognitiveScores = { attention: 0, memory: 0, logic: 0, control: 0 };
  const sum = (rs: typeof results) =>
    rs.reduce((acc, r) => {
      const s = JSON.parse(r.scoresJson) as CognitiveScores;
      return {
        attention: acc.attention + s.attention,
        memory: acc.memory + s.memory,
        logic: acc.logic + s.logic,
        control: acc.control + s.control,
      };
    }, zero);
  // нормировка: 100 = максимум очков за 7 идеальных сессий (3 упр. уровня 3, вес 3)
  const MAX = 7 * 3 * 3 * 3;
  const pct = (s: CognitiveScores): CognitiveScores => ({
    attention: Math.min(100, Math.round((s.attention / MAX) * 100)),
    memory: Math.min(100, Math.round((s.memory / MAX) * 100)),
    logic: Math.min(100, Math.round((s.logic / MAX) * 100)),
    control: Math.min(100, Math.round((s.control / MAX) * 100)),
  });
  const cur = pct(sum(results.filter((r) => now.getTime() - r.createdAt.getTime() < week)));
  const prev = pct(sum(results.filter((r) => {
    const age = now.getTime() - r.createdAt.getTime();
    return age >= week && age < 2 * week;
  })));
  return {
    current: cur,
    delta: {
      attention: cur.attention - prev.attention,
      memory: cur.memory - prev.memory,
      logic: cur.logic - prev.logic,
      control: cur.control - prev.control,
    },
  };
}
