export type RobotCommand = "up" | "down" | "left" | "right";
export type SimOutcome = "finish" | "trap" | "wall" | "out_of_energy";

const DELTAS: Record<RobotCommand, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function findStart(grid: string[]): { x: number; y: number } {
  for (let y = 0; y < grid.length; y++) {
    const x = grid[y].indexOf("S");
    if (x !== -1) return { x, y };
  }
  throw new Error("grid has no start cell (S)");
}

export function simulate(
  grid: string[],
  commands: RobotCommand[],
  energyLimit: number,
): { outcome: SimOutcome; path: { x: number; y: number }[] } {
  let pos = findStart(grid);
  const path = [{ ...pos }];

  for (let i = 0; i < commands.length; i++) {
    if (i >= energyLimit) return { outcome: "out_of_energy", path };

    const { dx, dy } = DELTAS[commands[i]];
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[ny].length) {
      return { outcome: "wall", path };
    }

    pos = { x: nx, y: ny };
    path.push({ ...pos });

    const cell = grid[ny][nx];
    if (cell === "#") return { outcome: "trap", path };
    if (cell === "F") return { outcome: "finish", path };
  }

  return { outcome: "out_of_energy", path };
}
