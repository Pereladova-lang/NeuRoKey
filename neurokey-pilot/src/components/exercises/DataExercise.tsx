"use client";

import { useEffect, useRef, useState } from "react";
import type { DataContent } from "@/lib/exercise-types";
import type { ExerciseProps } from "@/components/exercises/types";
import { accuracyForAttempt } from "@/components/exercises/types";
import { BarChart } from "@/components/exercises/BarChart";
import { cn } from "@/lib/utils";

export function DataExercise({ content, onComplete }: ExerciseProps<DataContent>) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [finalScores, setFinalScores] = useState<number[] | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!finalScores) return;
    const accuracy = finalScores.reduce((sum, s) => sum + s, 0) / finalScores.length;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    onComplete({ accuracy, durationSec });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalScores]);

  const question = content.questions[questionIndex];

  const handleOptionClick = (index: number) => {
    const attempt = attempts + 1;
    setAttempts(attempt);

    if (index !== question.correctIndex) {
      setWrongIndex(index);
      return;
    }

    setWrongIndex(null);
    const nextScores = [...scores, accuracyForAttempt(attempt)];

    if (questionIndex + 1 < content.questions.length) {
      setScores(nextScores);
      setQuestionIndex(questionIndex + 1);
      setAttempts(0);
    } else {
      setFinalScores(nextScores);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{content.title}</h2>

      <BarChart labels={content.chart.labels} values={content.chart.values} yLabel={content.chart.yLabel} />

      <p className="text-lg">{question.text}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            data-testid="exercise-option"
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

      {wrongIndex !== null && <p className="text-lg text-muted-foreground">Посмотри на график ещё раз 🙂</p>}
    </div>
  );
}
