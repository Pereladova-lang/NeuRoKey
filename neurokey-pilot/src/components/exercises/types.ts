export type ExerciseResult = { accuracy: number; durationSec: number };
export type ExerciseProps<C> = { content: C; onComplete: (r: ExerciseResult) => void };

export function accuracyForAttempt(attempt: number): number {
  if (attempt <= 1) return 1;
  if (attempt === 2) return 0.6;
  return 0.3;
}
