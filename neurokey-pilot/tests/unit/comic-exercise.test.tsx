// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComicExercise } from "@/components/exercises/ComicExercise";
import { comics } from "@/content/comics";

describe("ComicExercise", () => {
  const fixture = comics[0].content;

  it("shows a hint and does not complete on a wrong answer, completes with accuracy 0.6 on the second try", () => {
    const onComplete = vi.fn();
    render(<ComicExercise content={fixture} onComplete={onComplete} />);

    const wrongIndex = (fixture.correctIndex + 1) % fixture.options.length;
    fireEvent.click(screen.getByText(fixture.options[wrongIndex]));

    expect(screen.getByText(/Перечитай предыдущую реплику/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(fixture.options[fixture.correctIndex]));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ accuracy: 0.6 }));
  });
});
