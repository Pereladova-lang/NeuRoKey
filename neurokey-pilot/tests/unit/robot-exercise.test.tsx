// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RobotExercise } from "@/components/exercises/RobotExercise";
import type { RobotContent } from "@/lib/exercise-types";

// grid:
//   S . .
//   # . #
//   . . F
// only route to F is right, down, down, right.
const content: RobotContent = {
  title: "Тестовый склад",
  grid: ["S..", "#.#", "..F"],
  energyLimit: 10,
  commands: ["up", "down", "left", "right"],
};

function queuePath(commands: ("up" | "down" | "left" | "right")[]) {
  for (const cmd of commands) {
    fireEvent.click(screen.getByRole("button", { name: cmd }));
  }
  fireEvent.click(screen.getByRole("button", { name: "Запустить" }));
}

describe("RobotExercise", () => {
  it("completes with accuracy 1 on the first successful run", () => {
    const onComplete = vi.fn();
    render(<RobotExercise content={content} onComplete={onComplete} />);

    queuePath(["right", "down", "down", "right"]);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 1 }));
  });

  it("shows feedback and does not complete on a trap, then completes with accuracy 0.6 on the second run", () => {
    const onComplete = vi.fn();
    render(<RobotExercise content={content} onComplete={onComplete} />);

    queuePath(["down"]);
    expect(screen.getByText(/Почти! Попробуй другой маршрут/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    queuePath(["right", "down", "down", "right"]);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 0.6 }));
  });
});
