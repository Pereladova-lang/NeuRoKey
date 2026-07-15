import { describe, it, expect } from "vitest";
import { comics } from "@/content/comics";
import { dataTasks } from "@/content/dataTasks";
import { robotTasks } from "@/content/robotTasks";
import type { RobotContent } from "@/lib/exercise-types";

describe("seed content", () => {
  it("has 10 variants per level per type", () => {
    for (const pool of [comics, dataTasks, robotTasks]) {
      for (const level of [1, 2, 3] as const) {
        expect(pool.filter((x) => x.level === level)).toHaveLength(10);
      }
    }
  });
  it("comic correctIndex is valid", () => {
    for (const c of comics) {
      expect(c.content.correctIndex).toBeGreaterThanOrEqual(0);
      expect(c.content.correctIndex).toBeLessThan(c.content.options.length);
    }
  });
  it("robot grids contain start and finish", () => {
    for (const r of robotTasks) {
      const s = r.content.grid.join("");
      expect(s).toContain("S");
      expect(s).toContain("F");
    }
  });

  it("DataContent correctIndex is within bounds for every question", () => {
    for (const d of dataTasks) {
      for (const q of d.content.questions) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it("comic hiddenPanelIndex is within bounds and points at the null-speech panel", () => {
    for (const c of comics) {
      expect(c.content.hiddenPanelIndex).toBeGreaterThanOrEqual(0);
      expect(c.content.hiddenPanelIndex).toBeLessThan(c.content.panels.length);
      expect(c.content.panels[c.content.hiddenPanelIndex].speech).toBeNull();
    }
  });

  it("robot grids are pairwise unique within each level pool", () => {
    for (const level of [1, 2, 3] as const) {
      const grids = robotTasks
        .filter((r) => r.level === level)
        .map((r) => JSON.stringify(r.content.grid));
      const unique = new Set(grids);
      expect(
        unique.size,
        `Expected 10 unique grids for level ${level}, found ${unique.size}`
      ).toBe(grids.length);
    }
  });
});

describe("robot grid solvability (BFS)", () => {
  function shortestPathLength(content: RobotContent): number | null {
    const grid = content.grid.map((row) => row.split(""));
    const rows = grid.length;
    const cols = grid[0].length;
    let start: [number, number] | null = null;
    let finish: [number, number] | null = null;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "S") start = [r, c];
        if (grid[r][c] === "F") finish = [r, c];
      }
    }
    if (!start || !finish) return null;

    const dirs: Record<string, [number, number]> = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
    };
    const allowed = content.commands
      .map((cmd) => dirs[cmd])
      .filter((d): d is [number, number] => !!d);

    const visited = new Set<string>();
    let queue: { pos: [number, number]; dist: number }[] = [
      { pos: start, dist: 0 },
    ];
    visited.add(`${start[0]},${start[1]}`);

    while (queue.length > 0) {
      const next: typeof queue = [];
      for (const { pos, dist } of queue) {
        const [r, c] = pos;
        if (r === finish[0] && c === finish[1]) return dist;
        for (const [dr, dc] of allowed) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc] === "#") continue;
          const key = `${nr},${nc}`;
          if (visited.has(key)) continue;
          visited.add(key);
          next.push({ pos: [nr, nc], dist: dist + 1 });
        }
      }
      queue = next;
    }
    return null;
  }

  it("has a solvable path within energyLimit for every robot variant", () => {
    for (const r of robotTasks) {
      const dist = shortestPathLength(r.content);
      expect(
        dist,
        `No path found for "${r.content.title}" (level ${r.level})`
      ).not.toBeNull();
      expect(
        dist! <= r.content.energyLimit,
        `Shortest path (${dist}) exceeds energyLimit (${r.content.energyLimit}) for "${r.content.title}" (level ${r.level})`
      ).toBe(true);
    }
  });

  it("grid dimensions match level (5x5 / 6x6 / 7x7) and each grid has exactly one S and one F", () => {
    const expectedSize: Record<number, number> = { 1: 5, 2: 6, 3: 7 };
    for (const r of robotTasks) {
      const size = expectedSize[r.level];
      expect(r.content.grid.length).toBe(size);
      for (const row of r.content.grid) {
        expect(row.length).toBe(size);
      }
      const joined = r.content.grid.join("");
      expect(joined.split("").filter((ch) => ch === "S").length).toBe(1);
      expect(joined.split("").filter((ch) => ch === "F").length).toBe(1);
    }
  });
});
