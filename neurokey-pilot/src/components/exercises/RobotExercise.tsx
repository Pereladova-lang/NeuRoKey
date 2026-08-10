"use client";

import { useEffect, useRef, useState } from "react";
import type { RobotContent } from "@/lib/exercise-types";
import type { ExerciseProps } from "@/components/exercises/types";
import { accuracyForAttempt } from "@/components/exercises/types";
import { simulate, type RobotCommand } from "@/lib/robot-sim";
import { cn } from "@/lib/utils";

const COMMAND_LABELS: Record<RobotCommand, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

export function RobotExercise({ content, onComplete }: ExerciseProps<RobotContent>) {
  const [queue, setQueue] = useState<RobotCommand[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
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

  const addCommand = (cmd: RobotCommand) => {
    if (queue.length >= content.energyLimit) return;
    setQueue([...queue, cmd]);
  };

  const run = () => {
    const attempt = attempts + 1;
    setAttempts(attempt);

    const result = simulate(content.grid, queue, content.energyLimit);
    setQueue([]);

    if (result.outcome === "finish") {
      setFeedback(null);
      setCompletedAttempt(attempt);
      return;
    }

    setFeedback("Почти! Попробуй другой маршрут 🙂");
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{content.title}</h2>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${content.grid[0].length}, minmax(0, 1fr))` }}
      >
        {content.grid.map((row, y) =>
          row.split("").map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-lg",
                cell === "#" ? "bg-destructive/15" : "bg-muted",
              )}
            >
              {cell === "S" && "🤖"}
              {cell === "F" && "🏁"}
            </div>
          )),
        )}
      </div>

      <div className="flex gap-2">
        {content.commands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => addCommand(cmd)}
            aria-label={cmd}
            className="min-h-11 min-w-11 rounded-xl border border-border bg-card text-xl transition-colors duration-200 hover:bg-muted"
          >
            {COMMAND_LABELS[cmd]}
          </button>
        ))}
      </div>

      <p className="text-lg text-muted-foreground">
        Энергия: {content.energyLimit - queue.length} / {content.energyLimit}
      </p>

      <button
        type="button"
        onClick={run}
        disabled={queue.length === 0}
        className="min-h-11 rounded-xl bg-primary px-4 text-lg text-primary-foreground transition-colors duration-200 hover:bg-primary/80 disabled:opacity-50"
      >
        Запустить
      </button>

      {feedback && <p className="text-lg text-muted-foreground">{feedback}</p>}
    </div>
  );
}
