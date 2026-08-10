// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataExercise } from "@/components/exercises/DataExercise";
import { dataTasks } from "@/content/dataTasks";

describe("DataExercise", () => {
  const fixture = dataTasks[0].content;

  it("completes with accuracy 1 when every question is answered correctly first try", () => {
    const onComplete = vi.fn();
    render(<DataExercise content={fixture} onComplete={onComplete} />);

    for (const q of fixture.questions) {
      fireEvent.click(screen.getByRole("button", { name: q.options[q.correctIndex] }));
    }

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 1 }));
  });

  it("averages accuracy across questions: 0.6 on a missed first try nets 0.8 overall", () => {
    const onComplete = vi.fn();
    render(<DataExercise content={fixture} onComplete={onComplete} />);

    const [q1, q2] = fixture.questions;
    fireEvent.click(screen.getByRole("button", { name: q1.options[q1.correctIndex] }));

    const wrongIndex = (q2.correctIndex + 1) % q2.options.length;
    fireEvent.click(screen.getByRole("button", { name: q2.options[wrongIndex] }));
    fireEvent.click(screen.getByRole("button", { name: q2.options[q2.correctIndex] }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 0.8 }));
  });
});
