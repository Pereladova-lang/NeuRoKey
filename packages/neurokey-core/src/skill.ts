import type { ScaleId } from "./cognitive-profile";
import type { ExerciseType } from "./engine";

export interface Contributor {
  name: string;
  qualification: string;
  role: "methodologist" | "consultant" | "technical-partner" | "investor-partner";
  sharePercent: number;
}

export interface Reference {
  citation: string;
  url?: string;
}

export type SkillTriggerSignalType = "duration" | "contentType" | "combined";

export interface SkillTrigger {
  signalType: SkillTriggerSignalType;
  minDurationMinutes?: number;
  contentTypes?: string[];
}

export interface SkillExerciseParams {
  typeWeights: Partial<Record<ExerciseType, number>>;
  difficultyAdjustment: number;
}

export interface Skill {
  id: string;
  version: string;
  name: string;
  trigger: SkillTrigger;
  targetScales: ScaleId[];
  exerciseParams: SkillExerciseParams;
  authorship: Contributor[];
  citations: Reference[];
  createdAt: Date;
  effectiveFrom: Date;
}

export interface TriggerContext {
  durationMinutes?: number;
  contentType?: string;
}

function matchesDuration(trigger: SkillTrigger, context: TriggerContext): boolean {
  return (
    trigger.minDurationMinutes !== undefined &&
    context.durationMinutes !== undefined &&
    context.durationMinutes >= trigger.minDurationMinutes
  );
}

function matchesContentType(trigger: SkillTrigger, context: TriggerContext): boolean {
  return (
    trigger.contentTypes !== undefined &&
    context.contentType !== undefined &&
    trigger.contentTypes.includes(context.contentType)
  );
}

export function matchesTrigger(skill: Skill, context: TriggerContext): boolean {
  const { signalType } = skill.trigger;
  if (signalType === "duration") return matchesDuration(skill.trigger, context);
  if (signalType === "contentType") return matchesContentType(skill.trigger, context);
  return matchesDuration(skill.trigger, context) && matchesContentType(skill.trigger, context);
}

export function selectSkill(skills: Skill[], context: TriggerContext): Skill | null {
  return skills.find((skill) => matchesTrigger(skill, context)) ?? null;
}

export function nextSkillVersion(currentVersion: string): string {
  const [major, minor] = currentVersion.split(".").map(Number);
  return `${major}.${minor + 1}`;
}

export function reviseSkill(
  skill: Skill,
  changes: Partial<Pick<Skill, "trigger" | "targetScales" | "exerciseParams">>,
  now: Date,
): Skill {
  return {
    ...skill,
    ...changes,
    version: nextSkillVersion(skill.version),
    effectiveFrom: now,
  };
}
