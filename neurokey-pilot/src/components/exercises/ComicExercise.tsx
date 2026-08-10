"use client";

import { useEffect, useRef, useState } from "react";
import type { ComicContent } from "@/lib/exercise-types";
import type { ExerciseProps } from "@/components/exercises/types";
import { accuracyForAttempt } from "@/components/exercises/types";
import { cn } from "@/lib/utils";

export function ComicExercise({ content, onComplete }: ExerciseProps<ComicContent>) {
  const [attempts, setAttempts] = useState(0);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (completedAttempt === null) return;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    onComplete({ accuracy: accuracyForAttempt(completedAttempt), durationSec });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedAttempt]);

  const handleOptionClick = (index: number) => {
    const attempt = attempts + 1;
    setAttempts(attempt);

    if (index === content.correctIndex) {
      setWrongIndex(null);
      setCompletedAttempt(attempt);
      return;
    }

    setWrongIndex(index);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{content.title}</h2>

      <div className="flex flex-col gap-3">
        {content.panels.map((panel, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <span className="text-3xl leading-none">{panel.image}</span>
            {panel.speech === null ? (
              <span className="text-lg italic text-muted-foreground">?</span>
            ) : (
              <span className="text-lg">{panel.speech}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {content.options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleOptionClick(i)}
            className={cn(
              "min-h-11 rounded-xl border border-border px-4 py-3 text-left text-lg transition-colors duration-200",
              wrongIndex === i ? "bg-muted text-muted-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {wrongIndex !== null && (
        <p className="text-lg text-muted-foreground">Перечитай предыдущую реплику 🙂</p>
      )}
    </div>
  );
}
