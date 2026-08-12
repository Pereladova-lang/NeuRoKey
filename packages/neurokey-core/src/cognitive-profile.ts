export type ScaleId = string;

export interface ScaleSnapshot {
  weekStart: Date;
  scales: Record<ScaleId, number>;
}

export interface CognitiveProfile {
  userId: string;
  scales: Record<ScaleId, number>;
  history: ScaleSnapshot[];
  baselineCompletedAt: Date | null;
  lastAssessedAt: Date;
}

export type SignalSourceKind = "in-app-interaction" | "device-screen-time" | "visual-channel";

export interface SignalReading {
  scaleId: ScaleId;
  value: number; // 0-100
}

export interface SignalSource {
  kind: SignalSourceKind;
  readings: SignalReading[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diffFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffFromMonday);
  return d;
}

function averageReadings(sources: SignalSource[]): Record<ScaleId, number> {
  const sums = new Map<ScaleId, number>();
  const counts = new Map<ScaleId, number>();
  for (const source of sources) {
    for (const reading of source.readings) {
      sums.set(reading.scaleId, (sums.get(reading.scaleId) ?? 0) + reading.value);
      counts.set(reading.scaleId, (counts.get(reading.scaleId) ?? 0) + 1);
    }
  }
  const result: Record<ScaleId, number> = {};
  for (const [scaleId, sum] of sums) {
    result[scaleId] = Math.round(sum / (counts.get(scaleId) ?? 1));
  }
  return result;
}

export function computeBaseline(userId: string, sources: SignalSource[], now: Date): CognitiveProfile {
  const scales = averageReadings(sources);
  return {
    userId,
    scales,
    history: [{ weekStart: startOfWeek(now), scales }],
    baselineCompletedAt: now,
    lastAssessedAt: now,
  };
}

export function updateProfile(profile: CognitiveProfile, sources: SignalSource[], now: Date): CognitiveProfile {
  const incoming = averageReadings(sources);
  const scales: Record<ScaleId, number> = { ...profile.scales };
  for (const [scaleId, value] of Object.entries(incoming)) {
    const previous = scales[scaleId];
    scales[scaleId] = previous === undefined ? value : Math.round((previous + value) / 2);
  }

  const week = startOfWeek(now);
  const history = [...profile.history];
  const idx = history.findIndex((snapshot) => snapshot.weekStart.getTime() === week.getTime());
  if (idx >= 0) {
    history[idx] = { weekStart: week, scales };
  } else {
    history.push({ weekStart: week, scales });
  }

  return { ...profile, scales, history, lastAssessedAt: now };
}

export function scaleTrend(profile: CognitiveProfile, scaleId: ScaleId): number {
  const sorted = [...profile.history].sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  if (sorted.length < 2) return 0;
  const current = sorted[sorted.length - 1].scales[scaleId] ?? 0;
  const previous = sorted[sorted.length - 2].scales[scaleId] ?? 0;
  return current - previous;
}
