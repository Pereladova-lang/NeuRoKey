"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComicContent, DataContent, RobotContent } from "@/lib/exercise-types";
import type { ExerciseResult } from "@/components/exercises/types";
import { ComicExercise } from "@/components/exercises/ComicExercise";
import { DataExercise } from "@/components/exercises/DataExercise";
import { RobotExercise } from "@/components/exercises/RobotExercise";
import { Mascot } from "@/components/Mascot";
import { getMascotLine } from "@/lib/mascot-lines";
import { TYPE_LABELS } from "@/lib/type-labels";
import { Button } from "@/components/ui/button";

type SessionExercise = { id: string; type: "comic" | "data" | "robot"; level: number; content: unknown };

type FeedbackEmoji = "love" | "good" | "meh" | "bad";

const EMOJIS: { key: FeedbackEmoji; icon: string }[] = [
  { key: "love", icon: "😍" },
  { key: "good", icon: "😊" },
  { key: "meh", icon: "😐" },
  { key: "bad", icon: "😕" },
];

export function SessionRunner({ sessionId, exercises }: { sessionId: string; exercises: SessionExercise[] }) {
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [stage, setStage] = useState<"exercise" | "feedback" | "done">("exercise");
  const [result, setResult] = useState<{ streak: number; mascotLevel: number; newBadges: string[] } | null>(null);

  const current = exercises[index];

  async function handleComplete({ accuracy, durationSec }: ExerciseResult) {
    await fetch(`/api/session/${sessionId}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exerciseId: current.id, accuracy, durationSec }),
    });
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      setStartedAt(Date.now());
    } else {
      setStage("feedback");
    }
  }

  async function handleFeedback(feedbackEmoji: FeedbackEmoji) {
    const res = await fetch(`/api/session/${sessionId}/finish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedbackEmoji }),
    });
    const data = await res.json();
    setResult(data);
    setStage("done");
  }

  if (stage === "exercise") {
    const durationSec = () => Math.round((Date.now() - startedAt) / 1000);
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
        <p className="text-lg text-muted-foreground">
          Упражнение {index + 1} из {exercises.length}
        </p>
        {current.type === "comic" && (
          <ComicExercise
            content={current.content as ComicContent}
            onComplete={(r) => handleComplete({ ...r, durationSec: durationSec() })}
          />
        )}
        {current.type === "data" && (
          <DataExercise
            content={current.content as DataContent}
            onComplete={(r) => handleComplete({ ...r, durationSec: durationSec() })}
          />
        )}
        {current.type === "robot" && (
          <RobotExercise
            content={current.content as RobotContent}
            onComplete={(r) => handleComplete({ ...r, durationSec: durationSec() })}
          />
        )}
      </div>
    );
  }

  if (stage === "feedback") {
    const skills = Array.from(new Set(exercises.map((e) => TYPE_LABELS[e.type])));
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="text-xl font-medium">Сегодня ты развивал: {skills.join(", ")}</p>
        <p className="text-lg">Как тебе тренировка?</p>
        <div className="flex gap-3">
          {EMOJIS.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => handleFeedback(e.key)}
              className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl transition-transform hover:scale-105"
              aria-label={e.key}
            >
              {e.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 text-center">
      <Mascot level={result?.mascotLevel ?? 1} line={getMascotLine("sessionDone")} />
      <p className="text-lg">🔥 Стрик: {result?.streak}</p>
      {!!result?.newBadges.length && <p className="text-base">Новые бейджи: {result.newBadges.join(", ")}</p>}
      <Link href="/child/home">
        <Button className="h-12 px-8 text-lg">На главную</Button>
      </Link>
    </div>
  );
}
