import { test, expect, type Page } from "@playwright/test";
import { db } from "@/lib/db";
import { simulate, type RobotCommand } from "@/lib/robot-sim";
import type { RobotContent } from "@/lib/exercise-types";

/**
 * Happy path: register parent -> switch to the child screen (parent/child use
 * separate cookies, nothing to formally "log out" of) -> PIN login -> run a
 * full 3-exercise session -> emoji feedback -> home shows streak 1.
 *
 * Content is otherwise random per session (src/lib/engine.ts pickSessionTypes
 * shuffles types), so this test solves whatever it's shown rather than
 * assuming an order: Comic/Data exercises are solved generically (try each
 * option until the hint stops appearing), Robot is solved by fetching the
 * exact seeded exercise (deterministic while Config.e2eSeed is set — see
 * src/app/api/session/start/route.ts) and computing a winning command
 * sequence with the same `simulate` function the app itself uses.
 */

const ALL_COMMANDS: RobotCommand[] = ["up", "down", "left", "right"];

function solveRobot(content: RobotContent): RobotCommand[] {
  let frontier: RobotCommand[][] = [[]];
  for (let depth = 1; depth <= content.energyLimit; depth++) {
    const next: RobotCommand[][] = [];
    for (const seq of frontier) {
      for (const cmd of content.commands.length ? content.commands : ALL_COMMANDS) {
        const candidate = [...seq, cmd];
        const result = simulate(content.grid, candidate, content.energyLimit);
        if (result.outcome === "finish") return candidate;
        if (result.outcome === "wall" || result.outcome === "trap") continue;
        next.push(candidate);
      }
    }
    frontier = next;
  }
  throw new Error("no solution found for seeded robot exercise within its energy limit");
}

async function exerciseCounterText(page: Page): Promise<string | null> {
  // .first() avoids a strict-mode violation (→ caught → null, read as "already
  // advanced") if the outgoing and incoming exercise's counters both match
  // for a React tick during the transition.
  return page
    .locator("text=/Упражнение \\d+ из \\d+/")
    .first()
    .textContent({ timeout: 2000 })
    .catch(() => null);
}

/**
 * Solves a Comic or Data exercise by trying options until the wrong-answer
 * hint stops appearing. Always tries up to 3 options (Comic/Data content is
 * always authored with exactly 3) and relies on Playwright's built-in
 * actionability waiting on `.click()` rather than an upfront `.count()` —
 * counting immediately after a prior exercise unmounts can race the next
 * one mounting and read 0, causing a silent no-op.
 */
async function solveTextExercise(page: Page) {
  const before = await exerciseCounterText(page);
  const options = page.getByTestId("exercise-option");

  for (let round = 0; round < 8; round++) {
    if ((await exerciseCounterText(page)) !== before) return;
    if (await page.getByText("Сегодня ты развивал").isVisible().catch(() => false)) return;

    for (let i = 0; i < 3; i++) {
      await options.nth(i).click();
      await page.waitForTimeout(150);
      const hintVisible = await page
        .getByText(/Перечитай предыдущую реплику|Посмотри на график ещё раз/)
        .isVisible()
        .catch(() => false);
      if (!hintVisible) break;
    }
  }
  throw new Error("solveTextExercise did not advance after 8 rounds");
}

/**
 * Reads the "Энергия: X / Y" counter, which increments on every accepted
 * command click — a click landing before React attaches its handler (see
 * solveRobotExercise) leaves it unchanged, unlike the button's own visual
 * state which gives no such signal.
 */
async function energyUsed(page: Page): Promise<number | null> {
  const text = await page.getByText(/Энергия: \d+ \/ \d+/).textContent({ timeout: 2000 }).catch(() => null);
  const match = text?.match(/Энергия: (\d+) \/ (\d+)/);
  if (!match) return null;
  return Number(match[2]) - Number(match[1]);
}

async function solveRobotExercise(page: Page) {
  const exercise = await db.exercise.findFirst({
    where: { type: "robot", level: 1 },
    orderBy: { id: "asc" },
  });
  if (!exercise) throw new Error("no seeded robot exercise at level 1");
  const content = JSON.parse(exercise.contentJson) as RobotContent;
  const solution = solveRobot(content);

  for (let i = 0; i < solution.length; i++) {
    const cmd = solution[i];
    const expectedUsed = i + 1;
    // Retry the click until the energy counter confirms it actually landed —
    // the button is SSR-present and Playwright-actionable before React
    // attaches its onClick handler on a freshly-navigated production page,
    // so a single click can be silently lost.
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.getByRole("button", { name: cmd }).click();
      await page.waitForTimeout(100);
      if ((await energyUsed(page)) === expectedUsed) break;
      if (attempt === 9) throw new Error(`command "${cmd}" never registered after 10 attempts`);
    }
  }
  await page.getByRole("button", { name: "Запустить" }).click();
}

async function solveOneExercise(page: Page) {
  const before = await exerciseCounterText(page);
  const runButton = page.getByRole("button", { name: "Запустить" });
  const optionButtons = page.getByTestId("exercise-option").first();

  // Wait for either marker to actually mount before deciding the type — an
  // immediate .isVisible() right after the previous exercise unmounts can
  // still see its stale "Запустить" button and misdetect Comic/Data as Robot.
  await Promise.race([
    runButton.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
    optionButtons.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
  ]);

  const isRobot = await runButton.isVisible().catch(() => false);
  if (isRobot) {
    await solveRobotExercise(page);
  } else {
    await solveTextExercise(page);
  }

  // Robot's own "Запустить" button can still be visible for a tick after
  // this exercise's run() call while the next exercise mounts underneath
  // it — without this wait, the *next* call's detection above can see that
  // stale button and misdetect a Comic/Data exercise as Robot, then hang
  // forever looking for command buttons that don't exist on it.
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await exerciseCounterText(page)) !== before) return;
    if (await page.getByText("Сегодня ты развивал").isVisible().catch(() => false)) return;
    await page.waitForTimeout(150);
  }
}

test.describe("child session happy path", () => {
  test.beforeAll(async () => {
    await db.config.upsert({ where: { key: "e2eSeed" }, create: { key: "e2eSeed", value: "1" }, update: {} });
  });
  test.afterAll(async () => {
    await db.config.delete({ where: { key: "e2eSeed" } }).catch(() => {});
  });

  test("register -> child login -> full session -> feedback -> home streak 1", async ({ page }) => {
    const email = `e2e${Date.now()}@test.ru`;
    // Unique per run: /child lists every child in the DB with no family
    // scoping, so a fixed name would collide with children from prior runs.
    const childName = `E2E Ребёнок ${Date.now()}`;

    await page.goto("/parent");
    const registerForm = page.locator("form").nth(1);
    await registerForm.locator('input[name="email"]').fill(email);
    await registerForm.locator('input[name="password"]').fill("secret123");
    await registerForm.locator('input[name="childName"]').fill(childName);
    await registerForm.locator('input[name="childAge"]').fill("12");
    await registerForm.locator('input[name="childPin"]').fill("1234");
    await registerForm.locator('button[type="submit"]').click();
    await page.waitForURL("**/parent/dashboard");

    await page.goto("/child");
    await page.getByRole("button", { name: childName }).click();
    await page.getByRole("textbox").fill("1234");
    await page.getByRole("button", { name: "Войти" }).click();
    await page.waitForURL("**/child/home");

    await page.getByRole("button", { name: "Начать сессию" }).click();
    await page.waitForURL("**/child/session");
    // Give the first exercise's client component a moment to hydrate before
    // clicking — the DOM is present from SSR immediately, but a click before
    // React attaches its handlers is silently lost.
    await page.waitForLoadState("networkidle");

    for (let i = 0; i < 3; i++) {
      await solveOneExercise(page);
    }

    await expect(page.getByText("Сегодня ты развивал")).toBeVisible();
    await page.getByRole("button", { name: "good" }).click();

    await page.getByRole("button", { name: "На главную" }).click();
    await page.waitForURL("**/child/home");
    await expect(page.getByText("🔥 Стрик: 1")).toBeVisible();
  });
});
