import { describe, it, expect } from "vitest";
import { getMascotLine, MASCOT_LINES, type MascotContext } from "@/lib/mascot-lines";

const CONTEXTS: MascotContext[] = ["greeting", "sessionDone", "comeback", "levelUp", "trialEnded"];

describe("mascot-lines", () => {
  it("has at least 3 lines per context", () => {
    for (const ctx of CONTEXTS) {
      expect(MASCOT_LINES[ctx].length).toBeGreaterThanOrEqual(3);
    }
  });

  it("returns a non-empty line from the context's pool", () => {
    for (const ctx of CONTEXTS) {
      for (let i = 0; i < 20; i++) {
        const line = getMascotLine(ctx);
        expect(line.length).toBeGreaterThan(0);
        expect(MASCOT_LINES[ctx]).toContain(line);
      }
    }
  });
});
