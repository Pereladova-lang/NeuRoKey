import { describe, it, expect } from "vitest";
import { simulate } from "@/lib/robot-sim";

// grid:
//   S . .
//   # . #
//   . . F
// only column 1 is passable through row 1, so the only route to F is
// right, down, down, right.
const grid = ["S..", "#.#", "..F"];

describe("simulate", () => {
  it("reaches the finish via a safe route", () => {
    const result = simulate(grid, ["right", "down", "down", "right"], 10);
    expect(result.outcome).toBe("finish");
    expect(result.path[result.path.length - 1]).toEqual({ x: 2, y: 2 });
  });

  it("hits a trap", () => {
    const result = simulate(grid, ["down"], 10);
    expect(result.outcome).toBe("trap");
  });

  it("hits a wall when moving off the grid", () => {
    const result = simulate(grid, ["up"], 10);
    expect(result.outcome).toBe("wall");
  });

  it("runs out of energy before reaching the finish", () => {
    const result = simulate(grid, ["right", "down", "down", "right"], 2);
    expect(result.outcome).toBe("out_of_energy");
  });
});
